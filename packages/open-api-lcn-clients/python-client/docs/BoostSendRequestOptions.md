# BoostSendRequestOptions

Options for email/phone recipients (Universal Inbox)

## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**webhook_url** | **str** | Webhook URL to receive claim notifications | [optional] 
**suppress_delivery** | **bool** | If true, returns claimUrl without sending email/SMS | [optional] 
**branding** | [**BoostSendRequestOptionsBranding**](BoostSendRequestOptionsBranding.md) |  | [optional] 

## Example

```python
from openapi_client.models.boost_send_request_options import BoostSendRequestOptions

# TODO update the JSON string below
json = "{}"
# create an instance of BoostSendRequestOptions from a JSON string
boost_send_request_options_instance = BoostSendRequestOptions.from_json(json)
# print the JSON string representation of the object
print(BoostSendRequestOptions.to_json())

# convert the object into a dict
boost_send_request_options_dict = boost_send_request_options_instance.to_dict()
# create an instance of BoostSendRequestOptions from a dict
boost_send_request_options_from_dict = BoostSendRequestOptions.from_dict(boost_send_request_options_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


