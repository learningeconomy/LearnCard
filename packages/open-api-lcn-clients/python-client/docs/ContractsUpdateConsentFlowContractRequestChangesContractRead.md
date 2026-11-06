# ContractsUpdateConsentFlowContractRequestChangesContractRead

## Properties

| Name            | Type                                                                                                                                                       | Description | Notes      |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- | ---------- |
| **anonymize**   | **bool**                                                                                                                                                   |             | [optional] |
| **credentials** | [**ContractsUpdateConsentFlowContractRequestChangesContractReadCredentials**](ContractsUpdateConsentFlowContractRequestChangesContractReadCredentials.md)  |             | [optional] |
| **personal**    | [**Dict[str, ContractsCreateConsentFlowContractRequestContractReadPersonalValue]**](ContractsCreateConsentFlowContractRequestContractReadPersonalValue.md) |             | [optional] |

## Example

```python
from openapi_client.models.contracts_update_consent_flow_contract_request_changes_contract_read import ContractsUpdateConsentFlowContractRequestChangesContractRead

# TODO update the JSON string below
json = "{}"
# create an instance of ContractsUpdateConsentFlowContractRequestChangesContractRead from a JSON string
contracts_update_consent_flow_contract_request_changes_contract_read_instance = ContractsUpdateConsentFlowContractRequestChangesContractRead.from_json(json)
# print the JSON string representation of the object
print(ContractsUpdateConsentFlowContractRequestChangesContractRead.to_json())

# convert the object into a dict
contracts_update_consent_flow_contract_request_changes_contract_read_dict = contracts_update_consent_flow_contract_request_changes_contract_read_instance.to_dict()
# create an instance of ContractsUpdateConsentFlowContractRequestChangesContractRead from a dict
contracts_update_consent_flow_contract_request_changes_contract_read_from_dict = ContractsUpdateConsentFlowContractRequestChangesContractRead.from_dict(contracts_update_consent_flow_contract_request_changes_contract_read_dict)
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
