# StorageResolve200ResponseAnyOfAnyOfAnyOfAnyOfAnyOfAnyOf

## Properties

| Name                   | Type                                                                                                                                              | Description | Notes      |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- | ---------- |
| **context**            | [**List[BoostSendBoostRequestCredentialAnyOfContextInner]**](BoostSendBoostRequestCredentialAnyOfContextInner.md)                                 |             |
| **id**                 | **str**                                                                                                                                           |             | [optional] |
| **type**               | **List[str]**                                                                                                                                     |             |
| **issuer**             | [**StorageResolve200ResponseAnyOfAnyOfAnyOfAnyOfAnyOfAnyOfIssuer**](StorageResolve200ResponseAnyOfAnyOfAnyOfAnyOfAnyOfAnyOfIssuer.md)             |             |
| **credential_subject** | [**BoostSendBoostRequestCredentialAnyOfCredentialSubject**](BoostSendBoostRequestCredentialAnyOfCredentialSubject.md)                             |             |
| **refresh_service**    | [**BoostSendBoostRequestCredentialAnyOfRefreshService**](BoostSendBoostRequestCredentialAnyOfRefreshService.md)                                   |             | [optional] |
| **credential_schema**  | [**BoostSendBoostRequestCredentialAnyOfCredentialSchema**](BoostSendBoostRequestCredentialAnyOfCredentialSchema.md)                               |             | [optional] |
| **issuance_date**      | **str**                                                                                                                                           |             | [optional] |
| **expiration_date**    | **str**                                                                                                                                           |             | [optional] |
| **credential_status**  | [**BoostSendBoostRequestCredentialAnyOfRefreshService**](BoostSendBoostRequestCredentialAnyOfRefreshService.md)                                   |             | [optional] |
| **name**               | **str**                                                                                                                                           |             | [optional] |
| **description**        | **str**                                                                                                                                           |             | [optional] |
| **valid_from**         | **str**                                                                                                                                           |             | [optional] |
| **valid_until**        | **str**                                                                                                                                           |             | [optional] |
| **status**             | [**BoostSendBoostRequestCredentialAnyOfRefreshService**](BoostSendBoostRequestCredentialAnyOfRefreshService.md)                                   |             | [optional] |
| **terms_of_use**       | [**BoostSendBoostRequestCredentialAnyOfRefreshService**](BoostSendBoostRequestCredentialAnyOfRefreshService.md)                                   |             | [optional] |
| **evidence**           | [**BoostSendBoostRequestCredentialAnyOfEvidence**](BoostSendBoostRequestCredentialAnyOfEvidence.md)                                               |             | [optional] |
| **render_method**      | [**StorageResolve200ResponseAnyOfAnyOfAnyOfAnyOfAnyOfAnyOfRenderMethod**](StorageResolve200ResponseAnyOfAnyOfAnyOfAnyOfAnyOfAnyOfRenderMethod.md) |             | [optional] |

## Example

```python
from openapi_client.models.storage_resolve200_response_any_of_any_of_any_of_any_of_any_of_any_of import StorageResolve200ResponseAnyOfAnyOfAnyOfAnyOfAnyOfAnyOf

# TODO update the JSON string below
json = "{}"
# create an instance of StorageResolve200ResponseAnyOfAnyOfAnyOfAnyOfAnyOfAnyOf from a JSON string
storage_resolve200_response_any_of_any_of_any_of_any_of_any_of_any_of_instance = StorageResolve200ResponseAnyOfAnyOfAnyOfAnyOfAnyOfAnyOf.from_json(json)
# print the JSON string representation of the object
print(StorageResolve200ResponseAnyOfAnyOfAnyOfAnyOfAnyOfAnyOf.to_json())

# convert the object into a dict
storage_resolve200_response_any_of_any_of_any_of_any_of_any_of_any_of_dict = storage_resolve200_response_any_of_any_of_any_of_any_of_any_of_any_of_instance.to_dict()
# create an instance of StorageResolve200ResponseAnyOfAnyOfAnyOfAnyOfAnyOfAnyOf from a dict
storage_resolve200_response_any_of_any_of_any_of_any_of_any_of_any_of_from_dict = StorageResolve200ResponseAnyOfAnyOfAnyOfAnyOfAnyOfAnyOf.from_dict(storage_resolve200_response_any_of_any_of_any_of_any_of_any_of_any_of_dict)
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
