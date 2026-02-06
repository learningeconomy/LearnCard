# ContractsMarkContractRequestAsSeenRequest


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**contract_uri** | **str** |  | 
**target_profile_id** | **str** |  | 

## Example

```python
from openapi_client.models.contracts_mark_contract_request_as_seen_request import ContractsMarkContractRequestAsSeenRequest

# TODO update the JSON string below
json = "{}"
# create an instance of ContractsMarkContractRequestAsSeenRequest from a JSON string
contracts_mark_contract_request_as_seen_request_instance = ContractsMarkContractRequestAsSeenRequest.from_json(json)
# print the JSON string representation of the object
print(ContractsMarkContractRequestAsSeenRequest.to_json())

# convert the object into a dict
contracts_mark_contract_request_as_seen_request_dict = contracts_mark_contract_request_as_seen_request_instance.to_dict()
# create an instance of ContractsMarkContractRequestAsSeenRequest from a dict
contracts_mark_contract_request_as_seen_request_from_dict = ContractsMarkContractRequestAsSeenRequest.from_dict(contracts_mark_contract_request_as_seen_request_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


