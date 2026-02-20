# BoostRevokeBoostRecipientRequest


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**boost_uri** | **str** |  | 
**recipient_profile_id** | **str** |  | 

## Example

```python
from openapi_client.models.boost_revoke_boost_recipient_request import BoostRevokeBoostRecipientRequest

# TODO update the JSON string below
json = "{}"
# create an instance of BoostRevokeBoostRecipientRequest from a JSON string
boost_revoke_boost_recipient_request_instance = BoostRevokeBoostRecipientRequest.from_json(json)
# print the JSON string representation of the object
print(BoostRevokeBoostRecipientRequest.to_json())

# convert the object into a dict
boost_revoke_boost_recipient_request_dict = boost_revoke_boost_recipient_request_instance.to_dict()
# create an instance of BoostRevokeBoostRecipientRequest from a dict
boost_revoke_boost_recipient_request_from_dict = BoostRevokeBoostRecipientRequest.from_dict(boost_revoke_boost_recipient_request_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


