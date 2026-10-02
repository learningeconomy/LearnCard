# InboxGetMyInboxDeliveries200ResponseRecordsInnerCredential


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**protected** | **str** |  | 
**iv** | **str** |  | 
**ciphertext** | **str** |  | 
**tag** | **str** |  | 
**aad** | **str** |  | [optional] 
**recipients** | [**List[InboxGetMyInboxDeliveries200ResponseRecordsInnerCredentialRecipientsInner]**](InboxGetMyInboxDeliveries200ResponseRecordsInnerCredentialRecipientsInner.md) |  | [optional] 

## Example

```python
from openapi_client.models.inbox_get_my_inbox_deliveries200_response_records_inner_credential import InboxGetMyInboxDeliveries200ResponseRecordsInnerCredential

# TODO update the JSON string below
json = "{}"
# create an instance of InboxGetMyInboxDeliveries200ResponseRecordsInnerCredential from a JSON string
inbox_get_my_inbox_deliveries200_response_records_inner_credential_instance = InboxGetMyInboxDeliveries200ResponseRecordsInnerCredential.from_json(json)
# print the JSON string representation of the object
print(InboxGetMyInboxDeliveries200ResponseRecordsInnerCredential.to_json())

# convert the object into a dict
inbox_get_my_inbox_deliveries200_response_records_inner_credential_dict = inbox_get_my_inbox_deliveries200_response_records_inner_credential_instance.to_dict()
# create an instance of InboxGetMyInboxDeliveries200ResponseRecordsInnerCredential from a dict
inbox_get_my_inbox_deliveries200_response_records_inner_credential_from_dict = InboxGetMyInboxDeliveries200ResponseRecordsInnerCredential.from_dict(inbox_get_my_inbox_deliveries200_response_records_inner_credential_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


