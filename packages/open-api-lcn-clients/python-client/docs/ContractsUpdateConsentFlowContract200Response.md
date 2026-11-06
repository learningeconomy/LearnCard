# ContractsUpdateConsentFlowContract200Response

## Properties

| Name               | Type                                                                                                                                                                                            | Description | Notes |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- | ----- |
| **version**        | **int**                                                                                                                                                                                         |             |
| **kind**           | **str**                                                                                                                                                                                         |             |
| **affected_users** | **int**                                                                                                                                                                                         |             |
| **preview**        | [**CredentialGetHolderExportMetadata200ResponseConsentRecordsInnerContractLatestUpdatePreview**](CredentialGetHolderExportMetadata200ResponseConsentRecordsInnerContractLatestUpdatePreview.md) |             |

## Example

```python
from openapi_client.models.contracts_update_consent_flow_contract200_response import ContractsUpdateConsentFlowContract200Response

# TODO update the JSON string below
json = "{}"
# create an instance of ContractsUpdateConsentFlowContract200Response from a JSON string
contracts_update_consent_flow_contract200_response_instance = ContractsUpdateConsentFlowContract200Response.from_json(json)
# print the JSON string representation of the object
print(ContractsUpdateConsentFlowContract200Response.to_json())

# convert the object into a dict
contracts_update_consent_flow_contract200_response_dict = contracts_update_consent_flow_contract200_response_instance.to_dict()
# create an instance of ContractsUpdateConsentFlowContract200Response from a dict
contracts_update_consent_flow_contract200_response_from_dict = ContractsUpdateConsentFlowContract200Response.from_dict(contracts_update_consent_flow_contract200_response_dict)
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
