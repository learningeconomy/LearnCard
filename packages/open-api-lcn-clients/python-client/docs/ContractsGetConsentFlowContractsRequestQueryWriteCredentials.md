# ContractsGetConsentFlowContractsRequestQueryWriteCredentials

## Properties

| Name           | Type                                                                                                                                             | Description | Notes      |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | ----------- | ---------- |
| **categories** | [**Dict[str, ContractsGetConsentFlowContractsRequestQueryReadPersonalValue]**](ContractsGetConsentFlowContractsRequestQueryReadPersonalValue.md) |             | [optional] |

## Example

```python
from openapi_client.models.contracts_get_consent_flow_contracts_request_query_write_credentials import ContractsGetConsentFlowContractsRequestQueryWriteCredentials

# TODO update the JSON string below
json = "{}"
# create an instance of ContractsGetConsentFlowContractsRequestQueryWriteCredentials from a JSON string
contracts_get_consent_flow_contracts_request_query_write_credentials_instance = ContractsGetConsentFlowContractsRequestQueryWriteCredentials.from_json(json)
# print the JSON string representation of the object
print(ContractsGetConsentFlowContractsRequestQueryWriteCredentials.to_json())

# convert the object into a dict
contracts_get_consent_flow_contracts_request_query_write_credentials_dict = contracts_get_consent_flow_contracts_request_query_write_credentials_instance.to_dict()
# create an instance of ContractsGetConsentFlowContractsRequestQueryWriteCredentials from a dict
contracts_get_consent_flow_contracts_request_query_write_credentials_from_dict = ContractsGetConsentFlowContractsRequestQueryWriteCredentials.from_dict(contracts_get_consent_flow_contracts_request_query_write_credentials_dict)
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
