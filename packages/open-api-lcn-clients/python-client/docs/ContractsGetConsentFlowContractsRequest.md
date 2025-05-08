# ContractsGetConsentFlowContractsRequest


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**limit** | **float** |  | [optional] [default to 25]
**cursor** | **str** |  | [optional] 
**sort** | **str** |  | [optional] 
**query** | [**ContractsGetConsentFlowContractsRequestQuery**](ContractsGetConsentFlowContractsRequestQuery.md) |  | [optional] 

## Example

```python
from openapi_client.models.contracts_get_consent_flow_contracts_request import ContractsGetConsentFlowContractsRequest

# TODO update the JSON string below
json = "{}"
# create an instance of ContractsGetConsentFlowContractsRequest from a JSON string
contracts_get_consent_flow_contracts_request_instance = ContractsGetConsentFlowContractsRequest.from_json(json)
# print the JSON string representation of the object
print(ContractsGetConsentFlowContractsRequest.to_json())

# convert the object into a dict
contracts_get_consent_flow_contracts_request_dict = contracts_get_consent_flow_contracts_request_instance.to_dict()
# create an instance of ContractsGetConsentFlowContractsRequest from a dict
contracts_get_consent_flow_contracts_request_from_dict = ContractsGetConsentFlowContractsRequest.from_dict(contracts_get_consent_flow_contracts_request_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


