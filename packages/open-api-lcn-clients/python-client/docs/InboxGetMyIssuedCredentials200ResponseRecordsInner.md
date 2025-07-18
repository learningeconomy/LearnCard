# InboxGetMyIssuedCredentials200ResponseRecordsInner


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**id** | **str** |  | 
**credential** | **str** |  | 
**is_signed** | **bool** |  | 
**current_status** | **str** |  | 
**expires_at** | **str** |  | 
**created_at** | **str** |  | 
**issuer_did** | **str** |  | 
**webhook_url** | **str** |  | [optional] 
**signing_authority_endpoint** | **str** |  | [optional] 
**signing_authority_name** | **str** |  | [optional] 

## Example

```python
from openapi_client.models.inbox_get_my_issued_credentials200_response_records_inner import InboxGetMyIssuedCredentials200ResponseRecordsInner

# TODO update the JSON string below
json = "{}"
# create an instance of InboxGetMyIssuedCredentials200ResponseRecordsInner from a JSON string
inbox_get_my_issued_credentials200_response_records_inner_instance = InboxGetMyIssuedCredentials200ResponseRecordsInner.from_json(json)
# print the JSON string representation of the object
print(InboxGetMyIssuedCredentials200ResponseRecordsInner.to_json())

# convert the object into a dict
inbox_get_my_issued_credentials200_response_records_inner_dict = inbox_get_my_issued_credentials200_response_records_inner_instance.to_dict()
# create an instance of InboxGetMyIssuedCredentials200ResponseRecordsInner from a dict
inbox_get_my_issued_credentials200_response_records_inner_from_dict = InboxGetMyIssuedCredentials200ResponseRecordsInner.from_dict(inbox_get_my_issued_credentials200_response_records_inner_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


