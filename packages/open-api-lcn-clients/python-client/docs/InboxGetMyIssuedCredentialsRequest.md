# InboxGetMyIssuedCredentialsRequest


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**limit** | **float** |  | [optional] [default to 25]
**cursor** | **str** |  | [optional] 
**sort** | **str** |  | [optional] 
**query** | [**InboxGetMyIssuedCredentialsRequestQuery**](InboxGetMyIssuedCredentialsRequestQuery.md) |  | [optional] 
**recipient** | [**InboxIssue200ResponseRecipient**](InboxIssue200ResponseRecipient.md) |  | [optional] 

## Example

```python
from openapi_client.models.inbox_get_my_issued_credentials_request import InboxGetMyIssuedCredentialsRequest

# TODO update the JSON string below
json = "{}"
# create an instance of InboxGetMyIssuedCredentialsRequest from a JSON string
inbox_get_my_issued_credentials_request_instance = InboxGetMyIssuedCredentialsRequest.from_json(json)
# print the JSON string representation of the object
print(InboxGetMyIssuedCredentialsRequest.to_json())

# convert the object into a dict
inbox_get_my_issued_credentials_request_dict = inbox_get_my_issued_credentials_request_instance.to_dict()
# create an instance of InboxGetMyIssuedCredentialsRequest from a dict
inbox_get_my_issued_credentials_request_from_dict = InboxGetMyIssuedCredentialsRequest.from_dict(inbox_get_my_issued_credentials_request_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


