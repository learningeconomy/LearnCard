# ContractsGetConsentedDataRequest


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**limit** | **float** |  | [optional] [default to 25]
**cursor** | **str** |  | [optional] 
**sort** | **str** |  | [optional] 
**query** | [**ContractsGetConsentedDataForContractRequestQuery**](ContractsGetConsentedDataForContractRequestQuery.md) |  | [optional] 

## Example

```python
from openapi_client.models.contracts_get_consented_data_request import ContractsGetConsentedDataRequest

# TODO update the JSON string below
json = "{}"
# create an instance of ContractsGetConsentedDataRequest from a JSON string
contracts_get_consented_data_request_instance = ContractsGetConsentedDataRequest.from_json(json)
# print the JSON string representation of the object
print(ContractsGetConsentedDataRequest.to_json())

# convert the object into a dict
contracts_get_consented_data_request_dict = contracts_get_consented_data_request_instance.to_dict()
# create an instance of ContractsGetConsentedDataRequest from a dict
contracts_get_consented_data_request_from_dict = ContractsGetConsentedDataRequest.from_dict(contracts_get_consented_data_request_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


