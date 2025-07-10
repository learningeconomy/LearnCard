# InboxGetMyIssuedCredentials200Response


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**has_more** | **bool** |  | 
**records** | [**List[InboxGetMyIssuedCredentials200ResponseRecordsInner]**](InboxGetMyIssuedCredentials200ResponseRecordsInner.md) |  | 
**cursor** | **str** |  | [optional] 

## Example

```python
from openapi_client.models.inbox_get_my_issued_credentials200_response import InboxGetMyIssuedCredentials200Response

# TODO update the JSON string below
json = "{}"
# create an instance of InboxGetMyIssuedCredentials200Response from a JSON string
inbox_get_my_issued_credentials200_response_instance = InboxGetMyIssuedCredentials200Response.from_json(json)
# print the JSON string representation of the object
print(InboxGetMyIssuedCredentials200Response.to_json())

# convert the object into a dict
inbox_get_my_issued_credentials200_response_dict = inbox_get_my_issued_credentials200_response_instance.to_dict()
# create an instance of InboxGetMyIssuedCredentials200Response from a dict
inbox_get_my_issued_credentials200_response_from_dict = InboxGetMyIssuedCredentials200Response.from_dict(inbox_get_my_issued_credentials200_response_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


