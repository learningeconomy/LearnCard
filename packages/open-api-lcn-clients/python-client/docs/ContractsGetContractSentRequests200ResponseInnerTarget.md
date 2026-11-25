# ContractsGetContractSentRequests200ResponseInnerTarget

## Properties

| Name        | Type                                                                                                      | Description | Notes |
| ----------- | --------------------------------------------------------------------------------------------------------- | ----------- | ----- |
| **email**   | **str**                                                                                                   |             |
| **profile** | [**BoostGetBoostRecipients200ResponseInnerToAnyOf3**](BoostGetBoostRecipients200ResponseInnerToAnyOf3.md) |             |

## Example

```python
from openapi_client.models.contracts_get_contract_sent_requests200_response_inner_target import ContractsGetContractSentRequests200ResponseInnerTarget

# TODO update the JSON string below
json = "{}"
# create an instance of ContractsGetContractSentRequests200ResponseInnerTarget from a JSON string
contracts_get_contract_sent_requests200_response_inner_target_instance = ContractsGetContractSentRequests200ResponseInnerTarget.from_json(json)
# print the JSON string representation of the object
print(ContractsGetContractSentRequests200ResponseInnerTarget.to_json())

# convert the object into a dict
contracts_get_contract_sent_requests200_response_inner_target_dict = contracts_get_contract_sent_requests200_response_inner_target_instance.to_dict()
# create an instance of ContractsGetContractSentRequests200ResponseInnerTarget from a dict
contracts_get_contract_sent_requests200_response_inner_target_from_dict = ContractsGetContractSentRequests200ResponseInnerTarget.from_dict(contracts_get_contract_sent_requests200_response_inner_target_dict)
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
