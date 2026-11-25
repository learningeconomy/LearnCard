# ContractsUpdateConsentFlowContractRequestChangesContractWrite

## Properties

| Name            | Type                                                                                                                                                       | Description | Notes      |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- | ---------- |
| **credentials** | [**ContractsUpdateConsentFlowContractRequestChangesContractReadCredentials**](ContractsUpdateConsentFlowContractRequestChangesContractReadCredentials.md)  |             | [optional] |
| **personal**    | [**Dict[str, ContractsCreateConsentFlowContractRequestContractReadPersonalValue]**](ContractsCreateConsentFlowContractRequestContractReadPersonalValue.md) |             | [optional] |

## Example

```python
from openapi_client.models.contracts_update_consent_flow_contract_request_changes_contract_write import ContractsUpdateConsentFlowContractRequestChangesContractWrite

# TODO update the JSON string below
json = "{}"
# create an instance of ContractsUpdateConsentFlowContractRequestChangesContractWrite from a JSON string
contracts_update_consent_flow_contract_request_changes_contract_write_instance = ContractsUpdateConsentFlowContractRequestChangesContractWrite.from_json(json)
# print the JSON string representation of the object
print(ContractsUpdateConsentFlowContractRequestChangesContractWrite.to_json())

# convert the object into a dict
contracts_update_consent_flow_contract_request_changes_contract_write_dict = contracts_update_consent_flow_contract_request_changes_contract_write_instance.to_dict()
# create an instance of ContractsUpdateConsentFlowContractRequestChangesContractWrite from a dict
contracts_update_consent_flow_contract_request_changes_contract_write_from_dict = ContractsUpdateConsentFlowContractRequestChangesContractWrite.from_dict(contracts_update_consent_flow_contract_request_changes_contract_write_dict)
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
