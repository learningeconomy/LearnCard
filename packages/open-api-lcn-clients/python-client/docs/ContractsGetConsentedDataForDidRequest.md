# ContractsGetConsentedDataForDidRequest


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**limit** | **float** |  | [optional] [default to 25]
**cursor** | **str** |  | [optional] 
**sort** | **str** |  | [optional] 
**did** | **str** |  | 
**query** | [**ContractsGetConsentedDataForDidRequestQuery**](ContractsGetConsentedDataForDidRequestQuery.md) |  | [optional] 

## Example

```python
from openapi_client.models.contracts_get_consented_data_for_did_request import ContractsGetConsentedDataForDidRequest

# TODO update the JSON string below
json = "{}"
# create an instance of ContractsGetConsentedDataForDidRequest from a JSON string
contracts_get_consented_data_for_did_request_instance = ContractsGetConsentedDataForDidRequest.from_json(json)
# print the JSON string representation of the object
print(ContractsGetConsentedDataForDidRequest.to_json())

# convert the object into a dict
contracts_get_consented_data_for_did_request_dict = contracts_get_consented_data_for_did_request_instance.to_dict()
# create an instance of ContractsGetConsentedDataForDidRequest from a dict
contracts_get_consented_data_for_did_request_from_dict = ContractsGetConsentedDataForDidRequest.from_dict(contracts_get_consented_data_for_did_request_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


