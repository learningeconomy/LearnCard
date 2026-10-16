# ContractsRemoveContractRecipientRequest

## Properties

| Name             | Type    | Description | Notes |
| ---------------- | ------- | ----------- | ----- |
| **contract_uri** | **str** |             |
| **recipient**    | **str** |             |

## Example

```python
from openapi_client.models.contracts_remove_contract_recipient_request import ContractsRemoveContractRecipientRequest

# TODO update the JSON string below
json = "{}"
# create an instance of ContractsRemoveContractRecipientRequest from a JSON string
contracts_remove_contract_recipient_request_instance = ContractsRemoveContractRecipientRequest.from_json(json)
# print the JSON string representation of the object
print(ContractsRemoveContractRecipientRequest.to_json())

# convert the object into a dict
contracts_remove_contract_recipient_request_dict = contracts_remove_contract_recipient_request_instance.to_dict()
# create an instance of ContractsRemoveContractRecipientRequest from a dict
contracts_remove_contract_recipient_request_from_dict = ContractsRemoveContractRecipientRequest.from_dict(contracts_remove_contract_recipient_request_dict)
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
