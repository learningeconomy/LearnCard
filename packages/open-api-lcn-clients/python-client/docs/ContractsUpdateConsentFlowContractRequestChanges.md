# ContractsUpdateConsentFlowContractRequestChanges

## Properties

| Name                       | Type                                                                                                                              | Description | Notes      |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------------- | ----------- | ---------- |
| **contract**               | [**ContractsUpdateConsentFlowContractRequestChangesContract**](ContractsUpdateConsentFlowContractRequestChangesContract.md)       |             | [optional] |
| **name**                   | **str**                                                                                                                           |             | [optional] |
| **subtitle**               | **str**                                                                                                                           |             | [optional] |
| **description**            | **str**                                                                                                                           |             | [optional] |
| **reason_for_accessing**   | **str**                                                                                                                           |             | [optional] |
| **image**                  | **str**                                                                                                                           |             | [optional] |
| **needs_guardian_consent** | **bool**                                                                                                                          |             | [optional] |
| **redirect_url**           | **str**                                                                                                                           |             | [optional] |
| **front_door_boost_uri**   | **str**                                                                                                                           |             | [optional] |
| **expires_at**             | **str**                                                                                                                           |             | [optional] |
| **autoboosts**             | [**List[ContractsCreateConsentFlowContractRequestAutoboostsInner]**](ContractsCreateConsentFlowContractRequestAutoboostsInner.md) |             | [optional] |
| **writers**                | **List[str]**                                                                                                                     |             | [optional] |
| **recipients**             | **List[str]**                                                                                                                     |             | [optional] |

## Example

```python
from openapi_client.models.contracts_update_consent_flow_contract_request_changes import ContractsUpdateConsentFlowContractRequestChanges

# TODO update the JSON string below
json = "{}"
# create an instance of ContractsUpdateConsentFlowContractRequestChanges from a JSON string
contracts_update_consent_flow_contract_request_changes_instance = ContractsUpdateConsentFlowContractRequestChanges.from_json(json)
# print the JSON string representation of the object
print(ContractsUpdateConsentFlowContractRequestChanges.to_json())

# convert the object into a dict
contracts_update_consent_flow_contract_request_changes_dict = contracts_update_consent_flow_contract_request_changes_instance.to_dict()
# create an instance of ContractsUpdateConsentFlowContractRequestChanges from a dict
contracts_update_consent_flow_contract_request_changes_from_dict = ContractsUpdateConsentFlowContractRequestChanges.from_dict(contracts_update_consent_flow_contract_request_changes_dict)
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
