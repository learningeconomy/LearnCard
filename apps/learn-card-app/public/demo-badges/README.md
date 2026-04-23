# Demo Badge JSON

Static OBv3 badge fixtures served at `https://learncard.app/demo-badges/*.json` so
the `@learncard/embed-sdk` examples in `examples/badge-claim-example/` can complete
end-to-end claims without requiring partners to host their own JSON.

| File                            | Kind                   | Claim flow                                                                             |
| ------------------------------- | ---------------------- | -------------------------------------------------------------------------------------- |
| `accountability-signed.json`    | Pre-signed OBv3 VC     | LearnCard wraps in a VP (partner is cryptographic issuer of record)                    |
| `accountability-unsigned.json`  | Unsigned OBv3 template | LearnCard signs with its DID after DIDAuth binds the holder; partner preserved as `awardedBy` |

These files are mirrored from `examples/badge-claim-example/badges/*.json`. If you
change the example fixtures, update these too (and redeploy) so the public demo
keeps working.

Because Netlify has a SPA fallback at `/* -> /index.html`, putting these JSON files
under `public/demo-badges/` makes them static-assets shadow-matched before the SPA
redirect fires. Access-Control-Allow-Origin is `*` globally (see `netlify.toml`).
