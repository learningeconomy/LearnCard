# InboxGetMyInboxDeliveries200ResponseRecordsInnerCredentialRecipientsInnerHeader


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**alg** | **str** |  | 
**iv** | **str** |  | 
**tag** | **str** |  | 
**epk** | [**InboxGetMyInboxDeliveries200ResponseRecordsInnerCredentialRecipientsInnerHeaderEpk**](InboxGetMyInboxDeliveries200ResponseRecordsInnerCredentialRecipientsInnerHeaderEpk.md) |  | [optional] 
**kid** | **str** |  | [optional] 
**apv** | **str** |  | [optional] 
**apu** | **str** |  | [optional] 

## Example

```python
from openapi_client.models.inbox_get_my_inbox_deliveries200_response_records_inner_credential_recipients_inner_header import InboxGetMyInboxDeliveries200ResponseRecordsInnerCredentialRecipientsInnerHeader

# TODO update the JSON string below
json = "{}"
# create an instance of InboxGetMyInboxDeliveries200ResponseRecordsInnerCredentialRecipientsInnerHeader from a JSON string
inbox_get_my_inbox_deliveries200_response_records_inner_credential_recipients_inner_header_instance = InboxGetMyInboxDeliveries200ResponseRecordsInnerCredentialRecipientsInnerHeader.from_json(json)
# print the JSON string representation of the object
print(InboxGetMyInboxDeliveries200ResponseRecordsInnerCredentialRecipientsInnerHeader.to_json())

# convert the object into a dict
inbox_get_my_inbox_deliveries200_response_records_inner_credential_recipients_inner_header_dict = inbox_get_my_inbox_deliveries200_response_records_inner_credential_recipients_inner_header_instance.to_dict()
# create an instance of InboxGetMyInboxDeliveries200ResponseRecordsInnerCredentialRecipientsInnerHeader from a dict
inbox_get_my_inbox_deliveries200_response_records_inner_credential_recipients_inner_header_from_dict = InboxGetMyInboxDeliveries200ResponseRecordsInnerCredentialRecipientsInnerHeader.from_dict(inbox_get_my_inbox_deliveries200_response_records_inner_credential_recipients_inner_header_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


