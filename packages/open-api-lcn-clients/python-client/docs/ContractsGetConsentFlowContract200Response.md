# ContractsGetConsentFlowContract200Response


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**contract** | [**StorageResolve200ResponseAnyOfAnyOf**](StorageResolve200ResponseAnyOfAnyOf.md) |  | 
**owner** | [**BoostGetBoostRecipients200ResponseInnerTo**](BoostGetBoostRecipients200ResponseInnerTo.md) |  | 
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
**writers** | [**List[BoostGetBoostRecipients200ResponseInnerTo]**](BoostGetBoostRecipients200ResponseInnerTo.md) |  | [optional] 

## Example

```python
from openapi_client.models.contracts_get_consent_flow_contract200_response import ContractsGetConsentFlowContract200Response

# TODO update the JSON string below
json = "{}"
# create an instance of ContractsGetConsentFlowContract200Response from a JSON string
contracts_get_consent_flow_contract200_response_instance = ContractsGetConsentFlowContract200Response.from_json(json)
# print the JSON string representation of the object
print(ContractsGetConsentFlowContract200Response.to_json())

# convert the object into a dict
contracts_get_consent_flow_contract200_response_dict = contracts_get_consent_flow_contract200_response_instance.to_dict()
# create an instance of ContractsGetConsentFlowContract200Response from a dict
contracts_get_consent_flow_contract200_response_from_dict = ContractsGetConsentFlowContract200Response.from_dict(contracts_get_consent_flow_contract200_response_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


