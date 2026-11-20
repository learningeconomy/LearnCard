# ContractsSendContractRequest200Response

## Properties

| Name           | Type    | Description | Notes |
| -------------- | ------- | ----------- | ----- |
| **request_id** | **str** |             |
| **status**     | **str** |             |

## Example

```python
from openapi_client.models.contracts_send_contract_request200_response import ContractsSendContractRequest200Response

# TODO update the JSON string below
json = "{}"
# create an instance of ContractsSendContractRequest200Response from a JSON string
contracts_send_contract_request200_response_instance = ContractsSendContractRequest200Response.from_json(json)
# print the JSON string representation of the object
print(ContractsSendContractRequest200Response.to_json())

# convert the object into a dict
contracts_send_contract_request200_response_dict = contracts_send_contract_request200_response_instance.to_dict()
# create an instance of ContractsSendContractRequest200Response from a dict
contracts_send_contract_request200_response_from_dict = ContractsSendContractRequest200Response.from_dict(contracts_send_contract_request200_response_dict)
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
