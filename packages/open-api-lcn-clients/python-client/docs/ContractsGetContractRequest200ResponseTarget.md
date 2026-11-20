# ContractsGetContractRequest200ResponseTarget

## Properties

| Name        | Type                                                                                                      | Description | Notes |
| ----------- | --------------------------------------------------------------------------------------------------------- | ----------- | ----- |
| **email**   | **str**                                                                                                   |             |
| **profile** | [**BoostGetBoostRecipients200ResponseInnerToAnyOf3**](BoostGetBoostRecipients200ResponseInnerToAnyOf3.md) |             |

## Example

```python
from openapi_client.models.contracts_get_contract_request200_response_target import ContractsGetContractRequest200ResponseTarget

# TODO update the JSON string below
json = "{}"
# create an instance of ContractsGetContractRequest200ResponseTarget from a JSON string
contracts_get_contract_request200_response_target_instance = ContractsGetContractRequest200ResponseTarget.from_json(json)
# print the JSON string representation of the object
print(ContractsGetContractRequest200ResponseTarget.to_json())

# convert the object into a dict
contracts_get_contract_request200_response_target_dict = contracts_get_contract_request200_response_target_instance.to_dict()
# create an instance of ContractsGetContractRequest200ResponseTarget from a dict
contracts_get_contract_request200_response_target_from_dict = ContractsGetContractRequest200ResponseTarget.from_dict(contracts_get_contract_request200_response_target_dict)
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
