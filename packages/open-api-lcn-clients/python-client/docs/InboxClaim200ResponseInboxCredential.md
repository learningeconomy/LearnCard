# InboxClaim200ResponseInboxCredential


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**id** | **str** |  | 
**credential** | **str** |  | 
**is_signed** | **bool** |  | 
**current_status** | **str** |  | 
**is_accepted** | **bool** |  | [optional] 
**expires_at** | **str** |  | 
**created_at** | **str** |  | 
**issuer_did** | **str** |  | 
**webhook_url** | **str** |  | [optional] 
**boost_uri** | **str** |  | [optional] 
**activity_id** | **str** |  | [optional] 
**signing_authority** | [**InboxClaim200ResponseInboxCredentialSigningAuthority**](InboxClaim200ResponseInboxCredentialSigningAuthority.md) |  | [optional] 

## Example

```python
from openapi_client.models.inbox_claim200_response_inbox_credential import InboxClaim200ResponseInboxCredential

# TODO update the JSON string below
json = "{}"
# create an instance of InboxClaim200ResponseInboxCredential from a JSON string
inbox_claim200_response_inbox_credential_instance = InboxClaim200ResponseInboxCredential.from_json(json)
# print the JSON string representation of the object
print(InboxClaim200ResponseInboxCredential.to_json())

# convert the object into a dict
inbox_claim200_response_inbox_credential_dict = inbox_claim200_response_inbox_credential_instance.to_dict()
# create an instance of InboxClaim200ResponseInboxCredential from a dict
inbox_claim200_response_inbox_credential_from_dict = InboxClaim200ResponseInboxCredential.from_dict(inbox_claim200_response_inbox_credential_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


