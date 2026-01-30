# StorageResolve200ResponseAnyOfAnyOfAnyOfAnyOfAnyOfIssuer


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**id** | **str** |  | [optional] 
**type** | [**BoostSendRequestTemplateCredentialAnyOfIssuerAnyOfType**](BoostSendRequestTemplateCredentialAnyOfIssuerAnyOfType.md) |  | [optional] 
**name** | **str** |  | [optional] 
**url** | **str** |  | [optional] 
**phone** | **str** |  | [optional] 
**description** | **str** |  | [optional] 
**endorsement** | **List[object]** |  | [optional] 
**image** | [**StorageResolve200ResponseAnyOfAnyOfAnyOfAnyOfAnyOfIssuerAnyOfImage**](StorageResolve200ResponseAnyOfAnyOfAnyOfAnyOfAnyOfIssuerAnyOfImage.md) |  | [optional] 
**email** | **str** |  | [optional] 
**address** | [**StorageResolve200ResponseAnyOfAnyOfAnyOfAnyOfAnyOfIssuerAnyOfAddress**](StorageResolve200ResponseAnyOfAnyOfAnyOfAnyOfAnyOfIssuerAnyOfAddress.md) |  | [optional] 
**other_identifier** | [**List[StorageResolve200ResponseAnyOfAnyOfAnyOfAnyOfAnyOfIssuerAnyOfOtherIdentifierInner]**](StorageResolve200ResponseAnyOfAnyOfAnyOfAnyOfAnyOfIssuerAnyOfOtherIdentifierInner.md) |  | [optional] 
**official** | **str** |  | [optional] 
**parent_org** | **object** |  | [optional] 
**family_name** | **str** |  | [optional] 
**given_name** | **str** |  | [optional] 
**additional_name** | **str** |  | [optional] 
**patronymic_name** | **str** |  | [optional] 
**honorific_prefix** | **str** |  | [optional] 
**honorific_suffix** | **str** |  | [optional] 
**family_name_prefix** | **str** |  | [optional] 
**date_of_birth** | **str** |  | [optional] 

## Example

```python
from openapi_client.models.storage_resolve200_response_any_of_any_of_any_of_any_of_any_of_issuer import StorageResolve200ResponseAnyOfAnyOfAnyOfAnyOfAnyOfIssuer

# TODO update the JSON string below
json = "{}"
# create an instance of StorageResolve200ResponseAnyOfAnyOfAnyOfAnyOfAnyOfIssuer from a JSON string
storage_resolve200_response_any_of_any_of_any_of_any_of_any_of_issuer_instance = StorageResolve200ResponseAnyOfAnyOfAnyOfAnyOfAnyOfIssuer.from_json(json)
# print the JSON string representation of the object
print(StorageResolve200ResponseAnyOfAnyOfAnyOfAnyOfAnyOfIssuer.to_json())

# convert the object into a dict
storage_resolve200_response_any_of_any_of_any_of_any_of_any_of_issuer_dict = storage_resolve200_response_any_of_any_of_any_of_any_of_any_of_issuer_instance.to_dict()
# create an instance of StorageResolve200ResponseAnyOfAnyOfAnyOfAnyOfAnyOfIssuer from a dict
storage_resolve200_response_any_of_any_of_any_of_any_of_any_of_issuer_from_dict = StorageResolve200ResponseAnyOfAnyOfAnyOfAnyOfAnyOfIssuer.from_dict(storage_resolve200_response_any_of_any_of_any_of_any_of_any_of_issuer_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


