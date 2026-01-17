# BoostSendRequestOptionsBranding

Branding for email/SMS delivery

## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**issuer_name** | **str** | Name of the issuing organization | [optional] 
**issuer_logo_url** | **str** | Logo URL of the issuing organization | [optional] 
**credential_name** | **str** | Display name for the credential | [optional] 
**recipient_name** | **str** | Name of the recipient for personalization | [optional] 

## Example

```python
from openapi_client.models.boost_send_request_options_branding import BoostSendRequestOptionsBranding

# TODO update the JSON string below
json = "{}"
# create an instance of BoostSendRequestOptionsBranding from a JSON string
boost_send_request_options_branding_instance = BoostSendRequestOptionsBranding.from_json(json)
# print the JSON string representation of the object
print(BoostSendRequestOptionsBranding.to_json())

# convert the object into a dict
boost_send_request_options_branding_dict = boost_send_request_options_branding_instance.to_dict()
# create an instance of BoostSendRequestOptionsBranding from a dict
boost_send_request_options_branding_from_dict = BoostSendRequestOptionsBranding.from_dict(boost_send_request_options_branding_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


