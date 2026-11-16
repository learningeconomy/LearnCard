# ContractsUpdateConsentFlowContractRequestChangesContract

## Properties

| Name      | Type                                                                                                                                  | Description | Notes      |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------- | ----------- | ---------- |
| **read**  | [**ContractsUpdateConsentFlowContractRequestChangesContractRead**](ContractsUpdateConsentFlowContractRequestChangesContractRead.md)   |             | [optional] |
| **write** | [**ContractsUpdateConsentFlowContractRequestChangesContractWrite**](ContractsUpdateConsentFlowContractRequestChangesContractWrite.md) |             | [optional] |

## Example

```python
from openapi_client.models.contracts_update_consent_flow_contract_request_changes_contract import ContractsUpdateConsentFlowContractRequestChangesContract

# TODO update the JSON string below
json = "{}"
# create an instance of ContractsUpdateConsentFlowContractRequestChangesContract from a JSON string
contracts_update_consent_flow_contract_request_changes_contract_instance = ContractsUpdateConsentFlowContractRequestChangesContract.from_json(json)
# print the JSON string representation of the object
print(ContractsUpdateConsentFlowContractRequestChangesContract.to_json())

# convert the object into a dict
contracts_update_consent_flow_contract_request_changes_contract_dict = contracts_update_consent_flow_contract_request_changes_contract_instance.to_dict()
# create an instance of ContractsUpdateConsentFlowContractRequestChangesContract from a dict
contracts_update_consent_flow_contract_request_changes_contract_from_dict = ContractsUpdateConsentFlowContractRequestChangesContract.from_dict(contracts_update_consent_flow_contract_request_changes_contract_dict)
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
