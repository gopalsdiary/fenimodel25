sms\sms_api.html কোড কর। 
create a sms sending pannel for a school management system.  


get student from "student_database" table from superbase. 
dropdow by: active_class, active_section 
phone number colm name : father_mobile
<script src="../login/auth-check_copy.js"></script> থেকে কোড নাও। 
html language: English

চাইকে কোনো student কে ইনডিভিজুয়ালি ম্যাসেজ পাঠানো যাবে । অথবা পুরো ক্লাস কে একসাথে পাঠানো যাবে। 
--------------------------------------------
Bulk SMS BD API Documentation: 

Your Api Key  :  OoeroUS4e09DpgizNxCS

API URL (GET & POST) : http://bulksmsbd.net/api/smsapi?api_key=OoeroUS4e09DpgizNxCS&type=text&number=Receiver&senderid=8809617611082&message=TestSMS


api_key	API Key	Yes	API Key : OoeroUS4e09DpgizNxCS
senderid	 : 8809617611082
number	mobile number	Exp: 88017XXXXXXXX,88018XXXXXXXX,88019XXXXXXXX...
message	SMS body :	Please use url encoding to send some special characters like &, $, @ etc
messages	SMS body(for Many SMS API)	:	Mixed Phone Number and Message accroding to the Correct Format

Credit Balance API : http://bulksmsbd.net/api/getBalanceApi?api_key=OoeroUS4e09DpgizNxCS


----------------------------------------
Error Success Code & Meaning

202	    SMS Submitted Successfully
1001	Invalid Number
1002	sender id not correct/sender id is disabled
1003	Please Required all fields/Contact Your System Administrator
1005	Internal Error
1006	Balance Validity Not Available
1007	Balance Insufficient
1011	User Id not found
1012	Masking SMS must be sent in Bengali
1013	Sender Id has not found Gateway by api key
1014	Sender Type Name not found using this sender by api key
1015	Sender Id has not found Any Valid Gateway by api key
1016	Sender Type Name Active Price Info not found by this sender id
1017	Sender Type Name Price Info not found by this sender id
1018	The Owner of this (username) Account is disabled
1019	The (sender type name) Price of this (username) Account is disabled
1020	The parent of this account is not found.
1021	The parent active (sender type name) price of this account is not found.
1031	Your Account Not Verified, Please Contact Administrator.
1032	ip Not whitelisted