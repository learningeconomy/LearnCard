//! In-memory transactional driver, compiled only for tests/explicit fake builds.
//! No token cache: permanent receipt rows, exact CAS and atomic reads/writes are
//! the same contract as DynamoDB, including after a new store handle is created.
use super::*;
use std::{
    collections::BTreeMap,
    sync::{Arc, Mutex},
};

#[derive(Clone, Default)]
pub struct FakeDatabase {
    state: Arc<Mutex<State>>,
}
#[derive(Default)]
struct State {
    rows: BTreeMap<Key, Vec<u8>>,
    fault: Option<WriteFault>,
    delayed: Vec<Vec<Write>>,
    fail_read: bool,
}

pub enum WriteFault {
    BeforeCommit,
    AfterCommit,
    DelayedCommit,
}

impl FakeDatabase {
    pub fn store(&self, scope: Scope) -> impl AuthorityStore + use<> {
        Store {
            scope,
            backend: self.clone(),
        }
    }
    pub fn fail_next_write(&self, fault: WriteFault) -> Result<(), Error> {
        self.state.lock().map_err(|_| Error::Unavailable)?.fault = Some(fault);
        Ok(())
    }
    pub fn fail_next_read(&self) -> Result<(), Error> {
        self.state.lock().map_err(|_| Error::Unavailable)?.fail_read = true;
        Ok(())
    }
    /// Complete delayed transactions against current conditions, never captured
    /// snapshots. Used to model a response timeout while AWS still processes IO.
    pub fn complete_delayed(&self) -> Result<(), Error> {
        let mut state = self.state.lock().map_err(|_| Error::Unavailable)?;
        for writes in std::mem::take(&mut state.delayed) {
            apply(&mut state, &writes)?;
        }
        Ok(())
    }
}

fn apply(state: &mut State, writes: &[Write]) -> Result<(), Error> {
    require(!writes.is_empty() && writes.len() <= 4)?;
    require(writes.iter().map(|w| &w.key).collect::<BTreeSet<_>>().len() == writes.len())?;
    if writes
        .iter()
        .any(|w| state.rows.get(&w.key) != w.expected.as_ref())
    {
        return Err(Error::Rejected);
    }
    for write in writes {
        state.rows.insert(write.key.clone(), write.value.clone());
    }
    Ok(())
}

impl Backend for FakeDatabase {
    fn read<'a>(&'a self, keys: &'a [Key]) -> StoreFuture<'a, Vec<Option<Vec<u8>>>> {
        Box::pin(async move {
            let mut state = self.state.lock().map_err(|_| Error::Unavailable)?;
            if std::mem::take(&mut state.fail_read) {
                return Err(Error::Unavailable);
            }
            Ok(keys.iter().map(|k| state.rows.get(k).cloned()).collect())
        })
    }
    fn write<'a>(&'a self, writes: &'a [Write]) -> StoreFuture<'a, ()> {
        Box::pin(async move {
            let mut state = self.state.lock().map_err(|_| Error::Unavailable)?;
            let fault = state.fault.take();
            match fault {
                Some(WriteFault::BeforeCommit) => return Err(Error::UnknownOutcome),
                Some(WriteFault::DelayedCommit) => {
                    state.delayed.push(writes.to_vec());
                    return Err(Error::UnknownOutcome);
                }
                _ => {}
            }
            apply(&mut state, writes)?;
            if matches!(fault, Some(WriteFault::AfterCommit)) {
                Err(Error::UnknownOutcome)
            } else {
                Ok(())
            }
        })
    }
}
