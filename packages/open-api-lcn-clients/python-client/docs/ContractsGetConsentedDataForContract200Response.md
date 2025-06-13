# ContractsGetConsentedDataForContract200Response


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**cursor** | **str** |  | [optional] 
**has_more** | **bool** |  | 
**records** | [**List[ContractsGetConsentedDataForContract200ResponseRecordsInner]**](ContractsGetConsentedDataForContract200ResponseRecordsInner.md) |  | 

## Example

```python
from openapi_client.models.contracts_get_consented_data_for_contract200_response import ContractsGetConsentedDataForContract200Response

# TODO update the JSON string below
json = "{}"
# create an instance of ContractsGetConsentedDataForContract200Response from a JSON string
contracts_get_consented_data_for_contract200_response_instance = ContractsGetConsentedDataForContract200Response.from_json(json)
# print the JSON string representation of the object
print(ContractsGetConsentedDataForContract200Response.to_json())

# convert the object into a dict
contracts_get_consented_data_for_contract200_response_dict = contracts_get_consented_data_for_contract200_response_instance.to_dict()
# create an instance of ContractsGetConsentedDataForContract200Response from a dict
contracts_get_consented_data_for_contract200_response_from_dict = ContractsGetConsentedDataForContract200Response.from_dict(contracts_get_consented_data_for_contract200_response_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


