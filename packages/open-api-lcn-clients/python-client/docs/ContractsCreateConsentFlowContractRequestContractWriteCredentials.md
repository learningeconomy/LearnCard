# ContractsCreateConsentFlowContractRequestContractWriteCredentials

## Properties

| Name           | Type                                                                                                                                                       | Description | Notes      |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- | ---------- |
| **categories** | [**Dict[str, ContractsCreateConsentFlowContractRequestContractReadPersonalValue]**](ContractsCreateConsentFlowContractRequestContractReadPersonalValue.md) |             | [optional] |

## Example

```python
from openapi_client.models.contracts_create_consent_flow_contract_request_contract_write_credentials import ContractsCreateConsentFlowContractRequestContractWriteCredentials

# TODO update the JSON string below
json = "{}"
# create an instance of ContractsCreateConsentFlowContractRequestContractWriteCredentials from a JSON string
contracts_create_consent_flow_contract_request_contract_write_credentials_instance = ContractsCreateConsentFlowContractRequestContractWriteCredentials.from_json(json)
# print the JSON string representation of the object
print(ContractsCreateConsentFlowContractRequestContractWriteCredentials.to_json())

# convert the object into a dict
contracts_create_consent_flow_contract_request_contract_write_credentials_dict = contracts_create_consent_flow_contract_request_contract_write_credentials_instance.to_dict()
# create an instance of ContractsCreateConsentFlowContractRequestContractWriteCredentials from a dict
contracts_create_consent_flow_contract_request_contract_write_credentials_from_dict = ContractsCreateConsentFlowContractRequestContractWriteCredentials.from_dict(contracts_create_consent_flow_contract_request_contract_write_credentials_dict)
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
