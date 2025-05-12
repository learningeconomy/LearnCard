# ContractsCreateConsentFlowContractRequest


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**contract** | [**StorageResolve200ResponseAnyOfAnyOf**](StorageResolve200ResponseAnyOfAnyOf.md) |  | 
**name** | **str** |  | 
**subtitle** | **str** |  | [optional] 
**description** | **str** |  | [optional] 
**reason_for_accessing** | **str** |  | [optional] 
**needs_guardian_consent** | **bool** |  | [optional] 
**redirect_url** | **str** |  | [optional] 
**front_door_boost_uri** | **str** |  | [optional] 
**image** | **str** |  | [optional] 
**expires_at** | **str** |  | [optional] 
**autoboosts** | [**List[ContractsCreateConsentFlowContractRequestAutoboostsInner]**](ContractsCreateConsentFlowContractRequestAutoboostsInner.md) |  | [optional] 

## Example

```python
from openapi_client.models.contracts_create_consent_flow_contract_request import ContractsCreateConsentFlowContractRequest

# TODO update the JSON string below
json = "{}"
# create an instance of ContractsCreateConsentFlowContractRequest from a JSON string
contracts_create_consent_flow_contract_request_instance = ContractsCreateConsentFlowContractRequest.from_json(json)
# print the JSON string representation of the object
print(ContractsCreateConsentFlowContractRequest.to_json())

# convert the object into a dict
contracts_create_consent_flow_contract_request_dict = contracts_create_consent_flow_contract_request_instance.to_dict()
# create an instance of ContractsCreateConsentFlowContractRequest from a dict
contracts_create_consent_flow_contract_request_from_dict = ContractsCreateConsentFlowContractRequest.from_dict(contracts_create_consent_flow_contract_request_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


