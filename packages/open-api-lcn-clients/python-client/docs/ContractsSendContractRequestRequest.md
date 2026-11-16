# ContractsSendContractRequestRequest

## Properties

| Name                      | Type    | Description | Notes      |
| ------------------------- | ------- | ----------- | ---------- |
| **contract_uri**          | **str** |             |
| **target_profile_id**     | **str** |             |
| **external_reference_id** | **str** |             | [optional] |
| **message**               | **str** |             | [optional] |

## Example

```python
from openapi_client.models.contracts_send_contract_request_request import ContractsSendContractRequestRequest

# TODO update the JSON string below
json = "{}"
# create an instance of ContractsSendContractRequestRequest from a JSON string
contracts_send_contract_request_request_instance = ContractsSendContractRequestRequest.from_json(json)
# print the JSON string representation of the object
print(ContractsSendContractRequestRequest.to_json())

# convert the object into a dict
contracts_send_contract_request_request_dict = contracts_send_contract_request_request_instance.to_dict()
# create an instance of ContractsSendContractRequestRequest from a dict
contracts_send_contract_request_request_from_dict = ContractsSendContractRequestRequest.from_dict(contracts_send_contract_request_request_dict)
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
