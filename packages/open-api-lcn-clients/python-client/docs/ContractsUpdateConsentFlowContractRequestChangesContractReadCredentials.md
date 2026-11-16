# ContractsUpdateConsentFlowContractRequestChangesContractReadCredentials

## Properties

| Name           | Type                                                                                                                                                       | Description | Notes      |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- | ---------- |
| **categories** | [**Dict[str, ContractsCreateConsentFlowContractRequestContractReadPersonalValue]**](ContractsCreateConsentFlowContractRequestContractReadPersonalValue.md) |             | [optional] |

## Example

```python
from openapi_client.models.contracts_update_consent_flow_contract_request_changes_contract_read_credentials import ContractsUpdateConsentFlowContractRequestChangesContractReadCredentials

# TODO update the JSON string below
json = "{}"
# create an instance of ContractsUpdateConsentFlowContractRequestChangesContractReadCredentials from a JSON string
contracts_update_consent_flow_contract_request_changes_contract_read_credentials_instance = ContractsUpdateConsentFlowContractRequestChangesContractReadCredentials.from_json(json)
# print the JSON string representation of the object
print(ContractsUpdateConsentFlowContractRequestChangesContractReadCredentials.to_json())

# convert the object into a dict
contracts_update_consent_flow_contract_request_changes_contract_read_credentials_dict = contracts_update_consent_flow_contract_request_changes_contract_read_credentials_instance.to_dict()
# create an instance of ContractsUpdateConsentFlowContractRequestChangesContractReadCredentials from a dict
contracts_update_consent_flow_contract_request_changes_contract_read_credentials_from_dict = ContractsUpdateConsentFlowContractRequestChangesContractReadCredentials.from_dict(contracts_update_consent_flow_contract_request_changes_contract_read_credentials_dict)
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
