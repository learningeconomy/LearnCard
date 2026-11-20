# ContractsGetContractRequest200Response

## Properties

| Name                      | Type                                                                                                | Description | Notes      |
| ------------------------- | --------------------------------------------------------------------------------------------------- | ----------- | ---------- |
| **request_id**            | **str**                                                                                             |             |
| **status**                | **str**                                                                                             |             |
| **external_reference_id** | **str**                                                                                             |             | [optional] |
| **requested_at**          | **str**                                                                                             |             | [optional] |
| **expires_at**            | **str**                                                                                             |             | [optional] |
| **target**                | [**ContractsGetContractRequest200ResponseTarget**](ContractsGetContractRequest200ResponseTarget.md) |             |

## Example

```python
from openapi_client.models.contracts_get_contract_request200_response import ContractsGetContractRequest200Response

# TODO update the JSON string below
json = "{}"
# create an instance of ContractsGetContractRequest200Response from a JSON string
contracts_get_contract_request200_response_instance = ContractsGetContractRequest200Response.from_json(json)
# print the JSON string representation of the object
print(ContractsGetContractRequest200Response.to_json())

# convert the object into a dict
contracts_get_contract_request200_response_dict = contracts_get_contract_request200_response_instance.to_dict()
# create an instance of ContractsGetContractRequest200Response from a dict
contracts_get_contract_request200_response_from_dict = ContractsGetContractRequest200Response.from_dict(contracts_get_contract_request200_response_dict)
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
