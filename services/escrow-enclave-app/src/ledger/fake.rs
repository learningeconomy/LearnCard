use std::sync::Mutex;

use super::*;

/// Native test/emulation store, never a production durability or trust boundary.
#[derive(Default)]
pub struct FakeHeadStore {
    chains: Mutex<BTreeMap<String, Vec<LedgerRecord>>>,
}

impl FakeHeadStore {
    /// Deliberately bypass CAS to simulate a malicious parent's presented history.
    pub fn replace(&self, chain_id: &str, records: Vec<LedgerRecord>) -> Result<(), AppendError> {
        self.chains
            .lock()
            .map_err(|_| AppendError::Unavailable)?
            .insert(chain_id.into(), records);
        Ok(())
    }
}

impl HeadStore for FakeHeadStore {
    fn get_chain<'a>(&'a self, chain_id: &'a str) -> StoreFuture<'a, Vec<LedgerRecord>> {
        Box::pin(async move {
            Ok(self
                .chains
                .lock()
                .map_err(|_| AppendError::Unavailable)?
                .get(chain_id)
                .cloned()
                .unwrap_or_default())
        })
    }

    fn append<'a>(&'a self, chain_id: &'a str, record: &'a LedgerRecord) -> StoreFuture<'a, ()> {
        Box::pin(async move {
            let mut chains = self.chains.lock().map_err(|_| AppendError::Unavailable)?;
            let chain = chains.entry(chain_id.into()).or_default();
            let hash = chain
                .last()
                .map(LedgerRecord::record_hash)
                .transpose()
                .map_err(|_| AppendError::Unavailable)?
                .unwrap_or([0; 32]);
            if record.seq != chain.len() as u64 || record.prev_hash != hash {
                return Err(AppendError::Conflict);
            }
            chain.push(record.clone());
            Ok(())
        })
    }
}
