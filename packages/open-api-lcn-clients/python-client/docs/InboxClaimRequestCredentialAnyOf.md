# InboxClaimRequestCredentialAnyOf

## Properties

| Name                      | Type                                                                                                                                                        | Description | Notes      |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- | ---------- |
| **context**               | [**List[BoostSendBoostRequestCredentialAnyOfContextInner]**](BoostSendBoostRequestCredentialAnyOfContextInner.md)                                           |             |
| **id**                    | **str**                                                                                                                                                     |             | [optional] |
| **type**                  | **List[str]**                                                                                                                                               |             |
| **issuer**                | [**BoostSendRequestTemplateCredentialAnyOfIssuer**](BoostSendRequestTemplateCredentialAnyOfIssuer.md)                                                       |             |
| **credential_subject**    | [**BoostSendBoostRequestCredentialAnyOfCredentialSubject**](BoostSendBoostRequestCredentialAnyOfCredentialSubject.md)                                       |             |
| **refresh_service**       | [**BoostSendBoostRequestCredentialAnyOfRefreshService**](BoostSendBoostRequestCredentialAnyOfRefreshService.md)                                             |             | [optional] |
| **credential_schema**     | [**BoostSendBoostRequestCredentialAnyOfCredentialSchema**](BoostSendBoostRequestCredentialAnyOfCredentialSchema.md)                                         |             | [optional] |
| **issuance_date**         | **str**                                                                                                                                                     |             | [optional] |
| **expiration_date**       | **str**                                                                                                                                                     |             | [optional] |
| **credential_status**     | [**BoostSendBoostRequestCredentialAnyOfRefreshService**](BoostSendBoostRequestCredentialAnyOfRefreshService.md)                                             |             | [optional] |
| **name**                  | **str**                                                                                                                                                     |             | [optional] |
| **description**           | **str**                                                                                                                                                     |             | [optional] |
| **valid_from**            | **str**                                                                                                                                                     |             | [optional] |
| **valid_until**           | **str**                                                                                                                                                     |             | [optional] |
| **status**                | [**BoostSendBoostRequestCredentialAnyOfRefreshService**](BoostSendBoostRequestCredentialAnyOfRefreshService.md)                                             |             | [optional] |
| **terms_of_use**          | [**BoostSendBoostRequestCredentialAnyOfRefreshService**](BoostSendBoostRequestCredentialAnyOfRefreshService.md)                                             |             | [optional] |
| **evidence**              | [**BoostSendBoostRequestCredentialAnyOfEvidence**](BoostSendBoostRequestCredentialAnyOfEvidence.md)                                                         |             | [optional] |
| **render_method**         | [**BoostSendBoostRequestCredentialAnyOfRenderMethod**](BoostSendBoostRequestCredentialAnyOfRenderMethod.md)                                                 |             | [optional] |
| **proof**                 | [**BoostSendBoostRequestCredentialAnyOfProof**](BoostSendBoostRequestCredentialAnyOfProof.md)                                                               |             |
| **verifiable_credential** | [**PresentationSendPresentationRequestPresentationAnyOfVerifiableCredential**](PresentationSendPresentationRequestPresentationAnyOfVerifiableCredential.md) |             | [optional] |
| **holder**                | **str**                                                                                                                                                     |             | [optional] |

## Example

```python
from openapi_client.models.inbox_claim_request_credential_any_of import InboxClaimRequestCredentialAnyOf

# TODO update the JSON string below
json = "{}"
# create an instance of InboxClaimRequestCredentialAnyOf from a JSON string
inbox_claim_request_credential_any_of_instance = InboxClaimRequestCredentialAnyOf.from_json(json)
# print the JSON string representation of the object
print(InboxClaimRequestCredentialAnyOf.to_json())

# convert the object into a dict
inbox_claim_request_credential_any_of_dict = inbox_claim_request_credential_any_of_instance.to_dict()
# create an instance of InboxClaimRequestCredentialAnyOf from a dict
inbox_claim_request_credential_any_of_from_dict = InboxClaimRequestCredentialAnyOf.from_dict(inbox_claim_request_credential_any_of_dict)
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
