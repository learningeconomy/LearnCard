# ContractsGetContractConnections200ResponseRecordsInner

## Properties

| Name                      | Type    | Description | Notes      |
| ------------------------- | ------- | ----------- | ---------- |
| **profile_id**            | **str** |             |
| **did**                   | **str** |             |
| **did_key**               | **str** |             |
| **terms_uri**             | **str** |             |
| **status**                | **str** |             |
| **request_id**            | **str** |             | [optional] |
| **external_reference_id** | **str** |             | [optional] |
| **updated_at**            | **str** |             |

## Example

```python
from openapi_client.models.contracts_get_contract_connections200_response_records_inner import ContractsGetContractConnections200ResponseRecordsInner

# TODO update the JSON string below
json = "{}"
# create an instance of ContractsGetContractConnections200ResponseRecordsInner from a JSON string
contracts_get_contract_connections200_response_records_inner_instance = ContractsGetContractConnections200ResponseRecordsInner.from_json(json)
# print the JSON string representation of the object
print(ContractsGetContractConnections200ResponseRecordsInner.to_json())

# convert the object into a dict
contracts_get_contract_connections200_response_records_inner_dict = contracts_get_contract_connections200_response_records_inner_instance.to_dict()
# create an instance of ContractsGetContractConnections200ResponseRecordsInner from a dict
contracts_get_contract_connections200_response_records_inner_from_dict = ContractsGetContractConnections200ResponseRecordsInner.from_dict(contracts_get_contract_connections200_response_records_inner_dict)
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
