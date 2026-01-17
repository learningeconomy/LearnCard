# ContractsGetConsentedContractsRequestQueryReadCredentialsCategoriesValue


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**sharing** | **bool** |  | [optional] 
**shared** | **List[str]** |  | [optional] 
**share_all** | **bool** |  | [optional] 
**share_until** | **str** |  | [optional] 

## Example

```python
from openapi_client.models.contracts_get_consented_contracts_request_query_read_credentials_categories_value import ContractsGetConsentedContractsRequestQueryReadCredentialsCategoriesValue

# TODO update the JSON string below
json = "{}"
# create an instance of ContractsGetConsentedContractsRequestQueryReadCredentialsCategoriesValue from a JSON string
contracts_get_consented_contracts_request_query_read_credentials_categories_value_instance = ContractsGetConsentedContractsRequestQueryReadCredentialsCategoriesValue.from_json(json)
# print the JSON string representation of the object
print(ContractsGetConsentedContractsRequestQueryReadCredentialsCategoriesValue.to_json())

# convert the object into a dict
contracts_get_consented_contracts_request_query_read_credentials_categories_value_dict = contracts_get_consented_contracts_request_query_read_credentials_categories_value_instance.to_dict()
# create an instance of ContractsGetConsentedContractsRequestQueryReadCredentialsCategoriesValue from a dict
contracts_get_consented_contracts_request_query_read_credentials_categories_value_from_dict = ContractsGetConsentedContractsRequestQueryReadCredentialsCategoriesValue.from_dict(contracts_get_consented_contracts_request_query_read_credentials_categories_value_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


