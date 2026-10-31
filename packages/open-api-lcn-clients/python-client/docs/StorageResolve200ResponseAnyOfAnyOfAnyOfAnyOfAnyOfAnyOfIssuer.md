# StorageResolve200ResponseAnyOfAnyOfAnyOfAnyOfAnyOfAnyOfIssuer

## Properties

| Name                   | Type                                                                                                                                                                                          | Description | Notes      |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- | ---------- |
| **id**                 | **str**                                                                                                                                                                                       |             | [optional] |
| **type**               | [**BoostSendBoostRequestCredentialAnyOfIssuerAnyOfType**](BoostSendBoostRequestCredentialAnyOfIssuerAnyOfType.md)                                                                             |             | [optional] |
| **name**               | **str**                                                                                                                                                                                       |             | [optional] |
| **url**                | **str**                                                                                                                                                                                       |             | [optional] |
| **phone**              | **str**                                                                                                                                                                                       |             | [optional] |
| **description**        | **str**                                                                                                                                                                                       |             | [optional] |
| **endorsement**        | **List[object]**                                                                                                                                                                              |             | [optional] |
| **image**              | [**StorageResolve200ResponseAnyOfAnyOfAnyOfAnyOfAnyOfAnyOfIssuerAnyOfImage**](StorageResolve200ResponseAnyOfAnyOfAnyOfAnyOfAnyOfAnyOfIssuerAnyOfImage.md)                                     |             | [optional] |
| **email**              | **str**                                                                                                                                                                                       |             | [optional] |
| **address**            | [**StorageResolve200ResponseAnyOfAnyOfAnyOfAnyOfAnyOfAnyOfIssuerAnyOfAddress**](StorageResolve200ResponseAnyOfAnyOfAnyOfAnyOfAnyOfAnyOfIssuerAnyOfAddress.md)                                 |             | [optional] |
| **other_identifier**   | [**List[StorageResolve200ResponseAnyOfAnyOfAnyOfAnyOfAnyOfAnyOfIssuerAnyOfOtherIdentifierInner]**](StorageResolve200ResponseAnyOfAnyOfAnyOfAnyOfAnyOfAnyOfIssuerAnyOfOtherIdentifierInner.md) |             | [optional] |
| **official**           | **str**                                                                                                                                                                                       |             | [optional] |
| **parent_org**         | **object**                                                                                                                                                                                    |             | [optional] |
| **family_name**        | **str**                                                                                                                                                                                       |             | [optional] |
| **given_name**         | **str**                                                                                                                                                                                       |             | [optional] |
| **additional_name**    | **str**                                                                                                                                                                                       |             | [optional] |
| **patronymic_name**    | **str**                                                                                                                                                                                       |             | [optional] |
| **honorific_prefix**   | **str**                                                                                                                                                                                       |             | [optional] |
| **honorific_suffix**   | **str**                                                                                                                                                                                       |             | [optional] |
| **family_name_prefix** | **str**                                                                                                                                                                                       |             | [optional] |
| **date_of_birth**      | **str**                                                                                                                                                                                       |             | [optional] |

## Example

```python
from openapi_client.models.storage_resolve200_response_any_of_any_of_any_of_any_of_any_of_any_of_issuer import StorageResolve200ResponseAnyOfAnyOfAnyOfAnyOfAnyOfAnyOfIssuer

# TODO update the JSON string below
json = "{}"
# create an instance of StorageResolve200ResponseAnyOfAnyOfAnyOfAnyOfAnyOfAnyOfIssuer from a JSON string
storage_resolve200_response_any_of_any_of_any_of_any_of_any_of_any_of_issuer_instance = StorageResolve200ResponseAnyOfAnyOfAnyOfAnyOfAnyOfAnyOfIssuer.from_json(json)
# print the JSON string representation of the object
print(StorageResolve200ResponseAnyOfAnyOfAnyOfAnyOfAnyOfAnyOfIssuer.to_json())

# convert the object into a dict
storage_resolve200_response_any_of_any_of_any_of_any_of_any_of_any_of_issuer_dict = storage_resolve200_response_any_of_any_of_any_of_any_of_any_of_any_of_issuer_instance.to_dict()
# create an instance of StorageResolve200ResponseAnyOfAnyOfAnyOfAnyOfAnyOfAnyOfIssuer from a dict
storage_resolve200_response_any_of_any_of_any_of_any_of_any_of_any_of_issuer_from_dict = StorageResolve200ResponseAnyOfAnyOfAnyOfAnyOfAnyOfAnyOfIssuer.from_dict(storage_resolve200_response_any_of_any_of_any_of_any_of_any_of_any_of_issuer_dict)
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
