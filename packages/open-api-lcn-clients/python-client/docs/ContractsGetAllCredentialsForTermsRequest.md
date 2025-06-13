# ContractsGetAllCredentialsForTermsRequest


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**limit** | **float** |  | [optional] [default to 25]
**cursor** | **str** |  | [optional] 
**sort** | **str** |  | [optional] 
**include_received** | **bool** |  | [optional] [default to False]

## Example

```python
from openapi_client.models.contracts_get_all_credentials_for_terms_request import ContractsGetAllCredentialsForTermsRequest

# TODO update the JSON string below
json = "{}"
# create an instance of ContractsGetAllCredentialsForTermsRequest from a JSON string
contracts_get_all_credentials_for_terms_request_instance = ContractsGetAllCredentialsForTermsRequest.from_json(json)
# print the JSON string representation of the object
print(ContractsGetAllCredentialsForTermsRequest.to_json())

# convert the object into a dict
contracts_get_all_credentials_for_terms_request_dict = contracts_get_all_credentials_for_terms_request_instance.to_dict()
# create an instance of ContractsGetAllCredentialsForTermsRequest from a dict
contracts_get_all_credentials_for_terms_request_from_dict = ContractsGetAllCredentialsForTermsRequest.from_dict(contracts_get_all_credentials_for_terms_request_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


