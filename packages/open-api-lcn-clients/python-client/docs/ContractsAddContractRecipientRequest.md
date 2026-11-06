# ContractsAddContractRecipientRequest

## Properties

| Name             | Type    | Description | Notes |
| ---------------- | ------- | ----------- | ----- |
| **contract_uri** | **str** |             |
| **recipient**    | **str** |             |

## Example

```python
from openapi_client.models.contracts_add_contract_recipient_request import ContractsAddContractRecipientRequest

# TODO update the JSON string below
json = "{}"
# create an instance of ContractsAddContractRecipientRequest from a JSON string
contracts_add_contract_recipient_request_instance = ContractsAddContractRecipientRequest.from_json(json)
# print the JSON string representation of the object
print(ContractsAddContractRecipientRequest.to_json())

# convert the object into a dict
contracts_add_contract_recipient_request_dict = contracts_add_contract_recipient_request_instance.to_dict()
# create an instance of ContractsAddContractRecipientRequest from a dict
contracts_add_contract_recipient_request_from_dict = ContractsAddContractRecipientRequest.from_dict(contracts_add_contract_recipient_request_dict)
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
