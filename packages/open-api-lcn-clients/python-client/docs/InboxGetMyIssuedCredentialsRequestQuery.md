# InboxGetMyIssuedCredentialsRequestQuery


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**current_status** | **str** |  | [optional] 
**id** | **str** |  | [optional] 
**is_signed** | **bool** |  | [optional] 
**issuer_did** | **str** |  | [optional] 

## Example

```python
from openapi_client.models.inbox_get_my_issued_credentials_request_query import InboxGetMyIssuedCredentialsRequestQuery

# TODO update the JSON string below
json = "{}"
# create an instance of InboxGetMyIssuedCredentialsRequestQuery from a JSON string
inbox_get_my_issued_credentials_request_query_instance = InboxGetMyIssuedCredentialsRequestQuery.from_json(json)
# print the JSON string representation of the object
print(InboxGetMyIssuedCredentialsRequestQuery.to_json())

# convert the object into a dict
inbox_get_my_issued_credentials_request_query_dict = inbox_get_my_issued_credentials_request_query_instance.to_dict()
# create an instance of InboxGetMyIssuedCredentialsRequestQuery from a dict
inbox_get_my_issued_credentials_request_query_from_dict = InboxGetMyIssuedCredentialsRequestQuery.from_dict(inbox_get_my_issued_credentials_request_query_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


