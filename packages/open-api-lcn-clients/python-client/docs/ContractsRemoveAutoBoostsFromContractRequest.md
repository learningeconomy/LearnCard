# ContractsRemoveAutoBoostsFromContractRequest


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**contract_uri** | **str** |  | 
**boost_uris** | **List[str]** |  | 

## Example

```python
from openapi_client.models.contracts_remove_auto_boosts_from_contract_request import ContractsRemoveAutoBoostsFromContractRequest

# TODO update the JSON string below
json = "{}"
# create an instance of ContractsRemoveAutoBoostsFromContractRequest from a JSON string
contracts_remove_auto_boosts_from_contract_request_instance = ContractsRemoveAutoBoostsFromContractRequest.from_json(json)
# print the JSON string representation of the object
print(ContractsRemoveAutoBoostsFromContractRequest.to_json())

# convert the object into a dict
contracts_remove_auto_boosts_from_contract_request_dict = contracts_remove_auto_boosts_from_contract_request_instance.to_dict()
# create an instance of ContractsRemoveAutoBoostsFromContractRequest from a dict
contracts_remove_auto_boosts_from_contract_request_from_dict = ContractsRemoveAutoBoostsFromContractRequest.from_dict(contracts_remove_auto_boosts_from_contract_request_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


