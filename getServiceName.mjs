const getServiceName =(value) => {
    const options = {
      "ruqyah-consultancy": "রুকইয়াহ কনসালটেন্সি (৫০০৳)",
      "long-session": "রুকইয়াহ ট্রিটমেন্ট লং সেশন (৫৫০০৳)",
      "short-session": "রুকইয়াহ ট্রিটমেন্ট সর্ট সেশন (৩০০০৳)",
      "diagnosis": "রুকইয়াহ ডায়াগনোসিস (২৫০০৳)",
      "online-ruqyah": "অনলাইন লাইভ রুকইয়াহ (২৫০০৳)",
      "home-service": "হোম সার্ভিস (এলাভেদে, ঢাকায় ৭০০০৳)",
      "hijama": "হিজামা (প্রতি পয়েন্ট/কাপ ১৫০৳)",
    };
  
    const optionText = options[value];
    
    if (optionText) {
      // Remove the price part in parentheses using regular expression
      return optionText.replace(/\s?\([^\)]+\)/, '').trim();
    }
  
    return null; // Return null if value is not found
  }
  

  export default getServiceName;