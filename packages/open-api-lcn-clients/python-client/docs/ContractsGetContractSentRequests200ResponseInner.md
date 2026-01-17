# ContractsGetContractSentRequests200ResponseInner


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**profile** | [**BoostGetPaginatedBoostRecipients200ResponseRecordsInnerTo**](BoostGetPaginatedBoostRecipients200ResponseRecordsInnerTo.md) |  | 
**status** | **str** |  | 
**read_status** | **str** |  | [optional] 

## Example

```python
from openapi_client.models.contracts_get_contract_sent_requests200_response_inner import ContractsGetContractSentRequests200ResponseInner

# TODO update the JSON string below
json = "{}"
# create an instance of ContractsGetContractSentRequests200ResponseInner from a JSON string
contracts_get_contract_sent_requests200_response_inner_instance = ContractsGetContractSentRequests200ResponseInner.from_json(json)
# print the JSON string representation of the object
print(ContractsGetContractSentRequests200ResponseInner.to_json())

# convert the object into a dict
contracts_get_contract_sent_requests200_response_inner_dict = contracts_get_contract_sent_requests200_response_inner_instance.to_dict()
# create an instance of ContractsGetContractSentRequests200ResponseInner from a dict
contracts_get_contract_sent_requests200_response_inner_from_dict = ContractsGetContractSentRequests200ResponseInner.from_dict(contracts_get_contract_sent_requests200_response_inner_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


