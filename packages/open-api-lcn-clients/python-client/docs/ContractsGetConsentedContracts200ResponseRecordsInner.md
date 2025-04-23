# ContractsGetConsentedContracts200ResponseRecordsInner


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**expires_at** | **str** |  | [optional] 
**one_time** | **bool** |  | [optional] 
**terms** | [**StorageResolve200ResponseAnyOf1**](StorageResolve200ResponseAnyOf1.md) |  | 
**contract** | [**ContractsGetConsentFlowContract200Response**](ContractsGetConsentFlowContract200Response.md) |  | 
**uri** | **str** |  | 
**consenter** | [**BoostGetBoostRecipients200ResponseInnerTo**](BoostGetBoostRecipients200ResponseInnerTo.md) |  | 
**status** | **str** |  | 

## Example

```python
from openapi_client.models.contracts_get_consented_contracts200_response_records_inner import ContractsGetConsentedContracts200ResponseRecordsInner

# TODO update the JSON string below
json = "{}"
# create an instance of ContractsGetConsentedContracts200ResponseRecordsInner from a JSON string
contracts_get_consented_contracts200_response_records_inner_instance = ContractsGetConsentedContracts200ResponseRecordsInner.from_json(json)
# print the JSON string representation of the object
print(ContractsGetConsentedContracts200ResponseRecordsInner.to_json())

# convert the object into a dict
contracts_get_consented_contracts200_response_records_inner_dict = contracts_get_consented_contracts200_response_records_inner_instance.to_dict()
# create an instance of ContractsGetConsentedContracts200ResponseRecordsInner from a dict
contracts_get_consented_contracts200_response_records_inner_from_dict = ContractsGetConsentedContracts200ResponseRecordsInner.from_dict(contracts_get_consented_contracts200_response_records_inner_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


