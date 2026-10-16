# InboxFinalize200ResponseVerifiableCredentialsInner

## Properties

| Name                   | Type                                                                                                                                                                | Description | Notes      |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- | ---------- |
| **context**            | [**List[BoostSendRequestTemplateCredentialAnyOfContextInner]**](BoostSendRequestTemplateCredentialAnyOfContextInner.md)                                             |             |
| **id**                 | **str**                                                                                                                                                             |             | [optional] |
| **type**               | **List[str]**                                                                                                                                                       |             |
| **issuer**             | [**StorageResolve200ResponseAnyOfAnyOfAnyOfAnyOfAnyOfAnyOf1Issuer**](StorageResolve200ResponseAnyOfAnyOfAnyOfAnyOfAnyOfAnyOf1Issuer.md)                             |             |
| **credential_subject** | [**BoostSendRequestTemplateCredentialAnyOfCredentialSubject**](BoostSendRequestTemplateCredentialAnyOfCredentialSubject.md)                                         |             |
| **refresh_service**    | [**BoostSendBoostRequestCredentialAnyOfCredentialStatus**](BoostSendBoostRequestCredentialAnyOfCredentialStatus.md)                                                 |             | [optional] |
| **credential_schema**  | [**BoostSendRequestTemplateCredentialAnyOfCredentialSchema**](BoostSendRequestTemplateCredentialAnyOfCredentialSchema.md)                                           |             | [optional] |
| **issuance_date**      | **str**                                                                                                                                                             |             | [optional] |
| **expiration_date**    | **str**                                                                                                                                                             |             | [optional] |
| **credential_status**  | [**BoostSendBoostRequestCredentialAnyOfCredentialStatus**](BoostSendBoostRequestCredentialAnyOfCredentialStatus.md)                                                 |             | [optional] |
| **name**               | **str**                                                                                                                                                             |             | [optional] |
| **description**        | **str**                                                                                                                                                             |             | [optional] |
| **valid_from**         | **str**                                                                                                                                                             |             | [optional] |
| **valid_until**        | **str**                                                                                                                                                             |             | [optional] |
| **status**             | [**BoostSendBoostRequestCredentialAnyOfCredentialStatus**](BoostSendBoostRequestCredentialAnyOfCredentialStatus.md)                                                 |             | [optional] |
| **terms_of_use**       | [**BoostSendBoostRequestCredentialAnyOfCredentialStatus**](BoostSendBoostRequestCredentialAnyOfCredentialStatus.md)                                                 |             | [optional] |
| **evidence**           | [**BoostSendRequestTemplateCredentialAnyOfEvidence**](BoostSendRequestTemplateCredentialAnyOfEvidence.md)                                                           |             | [optional] |
| **render_method**      | [**StorageResolve200ResponseAnyOfAnyOfAnyOfAnyOfAnyOfAnyOf1RenderMethod**](StorageResolve200ResponseAnyOfAnyOfAnyOfAnyOfAnyOfAnyOf1RenderMethod.md)                 |             | [optional] |
| **proof**              | [**BoostSendRequestTemplateCredentialAnyOfProof**](BoostSendRequestTemplateCredentialAnyOfProof.md)                                                                 |             |
| **protected**          | **str**                                                                                                                                                             |             |
| **iv**                 | **str**                                                                                                                                                             |             |
| **ciphertext**         | **str**                                                                                                                                                             |             |
| **tag**                | **str**                                                                                                                                                             |             |
| **aad**                | **str**                                                                                                                                                             |             | [optional] |
| **recipients**         | [**List[InboxGetMyInboxDeliveries200ResponseRecordsInnerCredentialRecipientsInner]**](InboxGetMyInboxDeliveries200ResponseRecordsInnerCredentialRecipientsInner.md) |             | [optional] |

## Example

```python
from openapi_client.models.inbox_finalize200_response_verifiable_credentials_inner import InboxFinalize200ResponseVerifiableCredentialsInner

# TODO update the JSON string below
json = "{}"
# create an instance of InboxFinalize200ResponseVerifiableCredentialsInner from a JSON string
inbox_finalize200_response_verifiable_credentials_inner_instance = InboxFinalize200ResponseVerifiableCredentialsInner.from_json(json)
# print the JSON string representation of the object
print(InboxFinalize200ResponseVerifiableCredentialsInner.to_json())

# convert the object into a dict
inbox_finalize200_response_verifiable_credentials_inner_dict = inbox_finalize200_response_verifiable_credentials_inner_instance.to_dict()
# create an instance of InboxFinalize200ResponseVerifiableCredentialsInner from a dict
inbox_finalize200_response_verifiable_credentials_inner_from_dict = InboxFinalize200ResponseVerifiableCredentialsInner.from_dict(inbox_finalize200_response_verifiable_credentials_inner_dict)
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
