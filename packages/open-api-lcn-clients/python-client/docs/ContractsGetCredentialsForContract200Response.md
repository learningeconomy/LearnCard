# ContractsGetCredentialsForContract200Response


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**cursor** | **str** |  | [optional] 
**has_more** | **bool** |  | 
**records** | [**List[ContractsGetCredentialsForContract200ResponseRecordsInner]**](ContractsGetCredentialsForContract200ResponseRecordsInner.md) |  | 

## Example

```python
from openapi_client.models.contracts_get_credentials_for_contract200_response import ContractsGetCredentialsForContract200Response

# TODO update the JSON string below
json = "{}"
# create an instance of ContractsGetCredentialsForContract200Response from a JSON string
contracts_get_credentials_for_contract200_response_instance = ContractsGetCredentialsForContract200Response.from_json(json)
# print the JSON string representation of the object
print(ContractsGetCredentialsForContract200Response.to_json())

# convert the object into a dict
contracts_get_credentials_for_contract200_response_dict = contracts_get_credentials_for_contract200_response_instance.to_dict()
# create an instance of ContractsGetCredentialsForContract200Response from a dict
contracts_get_credentials_for_contract200_response_from_dict = ContractsGetCredentialsForContract200Response.from_dict(contracts_get_credentials_for_contract200_response_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


