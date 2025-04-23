# ContractsGetConsentFlowContracts200ResponseRecordsInner


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**contract** | [**StorageResolve200ResponseAnyOfAnyOf**](StorageResolve200ResponseAnyOfAnyOf.md) |  | 
**name** | **str** |  | 
**subtitle** | **str** |  | [optional] 
**description** | **str** |  | [optional] 
**reason_for_accessing** | **str** |  | [optional] 
**image** | **str** |  | [optional] 
**uri** | **str** |  | 
**needs_guardian_consent** | **bool** |  | [optional] 
**redirect_url** | **str** |  | [optional] 
**front_door_boost_uri** | **str** |  | [optional] 
**created_at** | **str** |  | 
**updated_at** | **str** |  | 
**expires_at** | **str** |  | [optional] 
**auto_boosts** | **List[str]** |  | [optional] 

## Example

```python
from openapi_client.models.contracts_get_consent_flow_contracts200_response_records_inner import ContractsGetConsentFlowContracts200ResponseRecordsInner

# TODO update the JSON string below
json = "{}"
# create an instance of ContractsGetConsentFlowContracts200ResponseRecordsInner from a JSON string
contracts_get_consent_flow_contracts200_response_records_inner_instance = ContractsGetConsentFlowContracts200ResponseRecordsInner.from_json(json)
# print the JSON string representation of the object
print(ContractsGetConsentFlowContracts200ResponseRecordsInner.to_json())

# convert the object into a dict
contracts_get_consent_flow_contracts200_response_records_inner_dict = contracts_get_consent_flow_contracts200_response_records_inner_instance.to_dict()
# create an instance of ContractsGetConsentFlowContracts200ResponseRecordsInner from a dict
contracts_get_consent_flow_contracts200_response_records_inner_from_dict = ContractsGetConsentFlowContracts200ResponseRecordsInner.from_dict(contracts_get_consent_flow_contracts200_response_records_inner_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


