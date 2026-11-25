//! PUBLIC, deterministic test keys. Never a production trust root.
use super::*;
use p384::ecdsa::{signature::Signer, DerSignature, Signature, SigningKey};
use sha2::{Digest, Sha384};
use x509_cert::{
    builder::{profile::BuilderProfile, Builder, CertificateBuilder},
    der::{Encode, EncodePem},
    ext::{
        pkix::{
            AuthorityKeyIdentifier, BasicConstraints, KeyUsage, KeyUsages, SubjectKeyIdentifier,
        },
        Extension, ToExtension,
    },
    name::Name,
    spki::{SubjectPublicKeyInfo, SubjectPublicKeyInfoRef},
    time::{Time, Validity},
    Certificate, TbsCertificate,
};

/// Reproduces the x509-cert 0.2 `Profile::{Root, SubCA, Leaf}` extension set
/// byte-for-byte (SKI, AKI except root, BasicConstraints, KeyUsage) so fake
/// NSM chains — and the golden `rootSha256` fixtures — are unchanged.
pub(crate) enum TestProfile {
    Root(Name),
    SubCa {
        subject: Name,
        issuer: Name,
        path_len_constraint: Option<u8>,
    },
    Leaf {
        subject: Name,
        issuer: Name,
    },
}

impl BuilderProfile for TestProfile {
    fn get_issuer(&self, subject: &Name) -> Name {
        match self {
            Self::Root(_) => subject.clone(),
            Self::SubCa { issuer, .. } | Self::Leaf { issuer, .. } => issuer.clone(),
        }
    }

    fn get_subject(&self) -> Name {
        match self {
            Self::Root(subject) | Self::SubCa { subject, .. } | Self::Leaf { subject, .. } => {
                subject.clone()
            }
        }
    }

    fn build_extensions(
        &self,
        spk: SubjectPublicKeyInfoRef<'_>,
        issuer_spk: SubjectPublicKeyInfoRef<'_>,
        tbs: &TbsCertificate,
    ) -> x509_cert::builder::Result<Vec<Extension>> {
        let subject = tbs.subject();
        let mut extensions = vec![SubjectKeyIdentifier::try_from(spk)?.to_extension(subject, &[])?];
        if !matches!(self, Self::Root(_)) {
            extensions.push(
                AuthorityKeyIdentifier::try_from(issuer_spk)?.to_extension(subject, &extensions)?,
            );
        }
        let constraints = match self {
            Self::Root(_) => BasicConstraints {
                ca: true,
                path_len_constraint: None,
            },
            Self::SubCa {
                path_len_constraint,
                ..
            } => BasicConstraints {
                ca: true,
                path_len_constraint: *path_len_constraint,
            },
            Self::Leaf { .. } => BasicConstraints {
                ca: false,
                path_len_constraint: None,
            },
        };
        extensions.push(constraints.to_extension(subject, &extensions)?);
        let usage = match self {
            Self::Leaf { .. } => KeyUsages::DigitalSignature | KeyUsages::NonRepudiation,
            _ => KeyUsages::KeyCertSign | KeyUsages::CRLSign,
        };
        extensions.push(KeyUsage(usage).to_extension(subject, &extensions)?);
        Ok(extensions)
    }
}

/// Fixed validity window shared by the deterministic test chains.
pub(crate) fn validity(not_before: u64, not_after: u64) -> x509_cert::der::Result<Validity> {
    let at = |s| Time::try_from(std::time::UNIX_EPOCH + std::time::Duration::from_secs(s));
    Ok(Validity::new(at(not_before)?, at(not_after)?))
}

/// Builds an RFC6979-deterministic P-384 test certificate.
pub(crate) fn certificate_builder(
    profile: TestProfile,
    serial: u32,
    validity: Validity,
    subject: &SigningKey,
) -> Result<CertificateBuilder<TestProfile>, Box<dyn std::error::Error>> {
    Ok(CertificateBuilder::new(
        profile,
        serial.into(),
        validity,
        SubjectPublicKeyInfo::from_key(subject.verifying_key())?,
    )?)
}

/// Native test driver; absent unless testing or explicitly enabling `fake-nsm`.
/// All keys are public test material. Timestamp and PCRs are caller-controlled.
pub struct FakeNsm {
    signer: SigningKey,
    root: Certificate,
    leaf: Vec<u8>,
    bundle: Vec<ByteBuf>,
    pub timestamp: u64,
    pub pcrs: [[u8; 48]; 3],
}

fn key(seed: &[u8; 32], role: u8) -> Result<SigningKey, NsmError> {
    // Domain-separated fixed-seed scalars. Invalid scalars fail rather than panic.
    let mut hash = Sha384::new();
    hash.update(b"learncard-fake-nsm-test-only-v1");
    hash.update(seed);
    hash.update([role]);
    SigningKey::from_slice(&hash.finalize()).map_err(|_| NsmError::Signing)
}

fn certificate(
    profile: TestProfile,
    serial: u32,
    subject: &SigningKey,
    issuer: &SigningKey,
) -> Result<Certificate, NsmError> {
    let build = || -> Result<Certificate, Box<dyn std::error::Error>> {
        Ok(certificate_builder(
            profile,
            serial,
            validity(1_577_836_800, 2_524_608_000)?,
            subject,
        )?
        .build::<_, DerSignature>(issuer)?)
    };
    build().map_err(|_| NsmError::Signing)
}

impl FakeNsm {
    /// Stable root/intermediate/leaf chain, deterministic RFC6979 signatures.
    pub fn new(timestamp: u64, pcrs: [[u8; 48]; 3]) -> Result<Self, NsmError> {
        Self::from_seed([42; 32], timestamp, pcrs)
    }

    /// Alternate public test seed, useful for wrong-root fixtures.
    pub fn from_seed(
        seed: [u8; 32],
        timestamp: u64,
        pcrs: [[u8; 48]; 3],
    ) -> Result<Self, NsmError> {
        let root_key = key(&seed, 0)?;
        let intermediate_key = key(&seed, 1)?;
        let signer = key(&seed, 2)?;
        let name = |s: &str| s.parse::<Name>().map_err(|_| NsmError::Signing);
        let root_name = name("CN=LearnCard TEST ONLY Nitro Root")?;
        let intermediate_name = name("CN=LearnCard TEST ONLY Nitro Intermediate")?;
        let root = certificate(
            TestProfile::Root(root_name.clone()),
            1,
            &root_key,
            &root_key,
        )?;
        let intermediate = certificate(
            TestProfile::SubCa {
                subject: intermediate_name.clone(),
                issuer: root_name,
                path_len_constraint: Some(0),
            },
            2,
            &intermediate_key,
            &root_key,
        )?;
        let leaf = certificate(
            TestProfile::Leaf {
                subject: name("CN=LearnCard TEST ONLY Nitro Leaf")?,
                issuer: intermediate_name,
            },
            3,
            &signer,
            &intermediate_key,
        )?;
        let to_der = |c: &Certificate| c.to_der().map_err(|_| NsmError::Signing);
        let bundle = vec![to_der(&root)?.into(), to_der(&intermediate)?.into()];
        Ok(Self {
            signer,
            root,
            leaf: to_der(&leaf)?,
            bundle,
            timestamp,
            pcrs,
        })
    }

    pub fn root_pem(&self) -> Result<String, NsmError> {
        self.root
            .to_pem(x509_cert::der::pem::LineEnding::LF)
            .map_err(|_| NsmError::Signing)
    }

    pub(super) fn document(&self, req: AttestationRequest) -> ParsedAttestation {
        ParsedAttestation {
            module_id: "learncard-fake-nsm-TEST-ONLY".into(),
            digest: "SHA384".into(),
            timestamp: self.timestamp,
            pcrs: (0..16)
                .map(|i| {
                    (
                        i,
                        self.pcrs
                            .get(i as usize)
                            .copied()
                            .unwrap_or([0; 48])
                            .to_vec()
                            .into(),
                    )
                })
                .collect(),
            certificate: self.leaf.clone().into(),
            cabundle: self.bundle.clone(),
            public_key: req.public_key.map(Into::into),
            user_data: Some(req.user_data.into()),
            nonce: Some(req.nonce.into()),
        }
    }

    pub(super) fn sign_document(&self, document: &ParsedAttestation) -> Result<Vec<u8>, NsmError> {
        let protected = encode(&Value::Map(vec![(1.into(), (-35).into())]))?;
        let payload = encode(document)?;
        let signature: Signature = self
            .signer
            .try_sign(&sig_structure(&protected, &payload)?)
            .map_err(|_| NsmError::Signing)?;
        encode(&Value::Array(vec![
            Value::Bytes(protected),
            Value::Map(vec![]),
            Value::Bytes(payload),
            Value::Bytes(signature.to_bytes().to_vec()),
        ]))
    }
}

pub(super) fn sig_structure(protected: &[u8], payload: &[u8]) -> Result<Vec<u8>, NsmError> {
    encode(&Value::Array(vec![
        Value::Text("Signature1".into()),
        Value::Bytes(protected.to_vec()),
        Value::Bytes(vec![]),
        Value::Bytes(payload.to_vec()),
    ]))
}

impl NsmDriver for FakeNsm {
    fn attest(&self, req: AttestationRequest) -> Result<Vec<u8>, NsmError> {
        req.validate()?;
        self.sign_document(&self.document(req))
    }
}
