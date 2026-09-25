use crate::{
    Event,
    framing::{Enclave, invalid},
};
use serde::Deserialize;
use serde_json::{Value, json};
use std::{
    io,
    process::Stdio,
    sync::{
        Arc,
        atomic::{AtomicBool, Ordering},
    },
    time::Duration,
};
use tokio::process::Command;

#[async_trait::async_trait]
pub trait Runner: Send + Sync {
    async fn run(&self, args: &[String]) -> io::Result<Vec<u8>>;
}
pub struct NitroCli;
#[async_trait::async_trait]
impl Runner for NitroCli {
    async fn run(&self, args: &[String]) -> io::Result<Vec<u8>> {
        use tokio::io::AsyncReadExt;
        let mut child = Command::new("nitro-cli")
            .args(args)
            .stdin(Stdio::null())
            .stderr(Stdio::null())
            .stdout(Stdio::piped())
            .kill_on_drop(true)
            .spawn()?;
        let output = child.stdout.take().ok_or_else(invalid)?;
        let mut bytes = Vec::new();
        tokio::time::timeout(Duration::from_secs(30), async {
            output.take(65537).read_to_end(&mut bytes).await?;
            if bytes.len() > 65536 || !child.wait().await?.success() {
                return Err(invalid());
            }
            Ok(bytes)
        })
        .await
        .map_err(|_| invalid())?
    }
}
#[derive(Deserialize)]
#[serde(rename_all = "PascalCase")]
struct Description {
    #[serde(rename = "EnclaveCID")]
    cid: u32,
    state: String,
}
pub struct Supervisor {
    pub runner: Arc<dyn Runner>,
    pub enclave: Arc<dyn Enclave>,
    pub ready: Arc<AtomicBool>,
    pub cid: u32,
    pub eif: String,
    pub cpus: u32,
    pub memory: u32,
    failures: u32,
}
impl Supervisor {
    pub fn new(
        runner: Arc<dyn Runner>,
        enclave: Arc<dyn Enclave>,
        cid: u32,
        eif: String,
        cpus: u32,
        memory: u32,
    ) -> Self {
        Self {
            runner,
            enclave,
            ready: Arc::new(AtomicBool::new(false)),
            cid,
            eif,
            cpus,
            memory,
            failures: 0,
        }
    }
    pub fn launch_args(&self) -> Vec<String> {
        vec![
            "run-enclave".into(),
            "--eif-path".into(),
            self.eif.clone(),
            "--cpu-count".into(),
            self.cpus.to_string(),
            "--memory".into(),
            self.memory.to_string(),
            "--enclave-cid".into(),
            self.cid.to_string(),
        ]
    }
    /// Unknown CLI state or a live-but-unhealthy enclave is NEVER a reason to restart.
    pub async fn tick(&mut self) -> io::Result<bool> {
        self.ready.store(false, Ordering::Release);
        let bytes = self.runner.run(&["describe-enclaves".into()]).await?;
        let descriptions: Vec<Description> =
            serde_json::from_slice(&bytes).map_err(|_| invalid())?;
        let running = descriptions.iter().any(|d| d.cid == self.cid);
        if !running {
            self.runner.run(&self.launch_args()).await?;
            return Ok(true);
        }
        if !descriptions
            .iter()
            .any(|d| d.cid == self.cid && d.state == "RUNNING")
        {
            return Err(invalid());
        }
        let reply = tokio::time::timeout(
            Duration::from_secs(3),
            self.enclave.exchange(br#"{"method":"health"}"#.to_vec()),
        )
        .await
        .map_err(|_| invalid())??;
        let value: Value = serde_json::from_slice(&reply).map_err(|_| invalid())?;
        if value != json!({"method":"health","ok":true}) {
            return Err(invalid());
        }
        self.ready.store(true, Ordering::Release);
        self.failures = 0;
        Ok(false)
    }
    pub fn backoff(&mut self) -> Duration {
        let seconds = 1u64 << self.failures.min(6);
        self.failures = self.failures.saturating_add(1);
        Duration::from_secs(seconds.min(60))
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::collections::VecDeque;
    struct FakeRunner {
        replies: tokio::sync::Mutex<VecDeque<Vec<u8>>>,
        args: tokio::sync::Mutex<Vec<Vec<String>>>,
    }
    #[async_trait::async_trait]
    impl Runner for FakeRunner {
        async fn run(&self, args: &[String]) -> io::Result<Vec<u8>> {
            self.args.lock().await.push(args.to_vec());
            self.replies.lock().await.pop_front().ok_or_else(invalid)
        }
    }
    struct FakeEnclave;
    #[async_trait::async_trait]
    impl Enclave for FakeEnclave {
        async fn exchange(&self, _: Vec<u8>) -> io::Result<Vec<u8>> {
            Ok(br#"{"method":"health","ok":true}"#.to_vec())
        }
    }
    #[tokio::test]
    async fn restart_only_on_confirmed_absence_and_backoff() {
        let runner = Arc::new(FakeRunner {
            replies: tokio::sync::Mutex::new(
                [
                    b"[]".to_vec(),
                    b"{}".to_vec(),
                    br#"[{"EnclaveCID":16,"State":"RUNNING"}]"#.to_vec(),
                    b"[]".to_vec(),
                    b"{}".to_vec(),
                ]
                .into(),
            ),
            args: Default::default(),
        });
        let mut s = Supervisor::new(
            runner.clone(),
            Arc::new(FakeEnclave),
            16,
            "image.eif".into(),
            2,
            2048,
        );
        assert!(!s.launch_args().iter().any(|s| s == "--debug-mode"));
        assert!(s.tick().await.unwrap());
        assert!(!s.tick().await.unwrap());
        assert!(s.ready.load(Ordering::Acquire));
        assert!(s.tick().await.unwrap());
        assert_eq!(runner.args.lock().await.len(), 5);
        assert_eq!(s.backoff().as_secs(), 1);
        assert_eq!(s.backoff().as_secs(), 2);
        for _ in 0..20 {
            s.backoff();
        }
        assert_eq!(s.backoff().as_secs(), 60);
        assert!(s.tick().await.is_err());
        assert!(!s.ready.load(Ordering::Acquire));
    }
}

pub async fn run(mut supervisor: Supervisor) -> io::Result<()> {
    loop {
        let result = supervisor.tick().await;
        match result {
            Ok(true) => {
                tokio::time::sleep(supervisor.backoff()).await;
            }
            Ok(false) => tokio::time::sleep(Duration::from_secs(5)).await,
            Err(_) => {
                Event::SupervisorUnavailable.log();
                tokio::time::sleep(supervisor.backoff()).await;
            }
        }
    }
}
