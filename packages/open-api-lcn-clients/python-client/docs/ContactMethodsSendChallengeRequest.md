# ContactMethodsSendChallengeRequest


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**value** | **str** |  | 
**type** | **str** |  | 
**configuration** | [**ContactMethodsSendChallengeRequestConfiguration**](ContactMethodsSendChallengeRequestConfiguration.md) |  | 

## Example

```python
from openapi_client.models.contact_methods_send_challenge_request import ContactMethodsSendChallengeRequest

# TODO update the JSON string below
json = "{}"
# create an instance of ContactMethodsSendChallengeRequest from a JSON string
contact_methods_send_challenge_request_instance = ContactMethodsSendChallengeRequest.from_json(json)
# print the JSON string representation of the object
print(ContactMethodsSendChallengeRequest.to_json())

# convert the object into a dict
contact_methods_send_challenge_request_dict = contact_methods_send_challenge_request_instance.to_dict()
# create an instance of ContactMethodsSendChallengeRequest from a dict
contact_methods_send_challenge_request_from_dict = ContactMethodsSendChallengeRequest.from_dict(contact_methods_send_challenge_request_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


