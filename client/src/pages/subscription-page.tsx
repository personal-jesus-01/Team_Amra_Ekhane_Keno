import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import Sidebar from "@/components/sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Loader2, CreditCard } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubscriptionType } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function SubscriptionPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionType | null>(null);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [cardNumber, setCardNumber] = useState("");
  const [cardName, setCardName] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvc, setCardCvc] = useState("");

  // Subscription purchase mutation
  const purchaseMutation = useMutation({
    mutationFn: async (type: SubscriptionType) => {
      const res = await apiRequest("POST", "/api/subscription/purchase", {
        type,
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      setPaymentModalOpen(false);
      toast({
        title: "Purchase successful",
        description: 
          selectedPlan === "pro" 
            ? "Your Pro subscription is now active!" 
            : "You have purchased 1 credit for a single presentation.",
      });
      setSelectedPlan(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Purchase failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle subscription purchase
  const handlePurchase = () => {
    if (!selectedPlan) return;
    
    // Validate card details in a real implementation
    if (!cardNumber || !cardName || !cardExpiry || !cardCvc) {
      toast({
        title: "Missing information",
        description: "Please fill in all card details.",
        variant: "destructive",
      });
      return;
    }
    
    purchaseMutation.mutate(selectedPlan);
  };

  // Format credit card number with spaces
  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || "";
    const parts = [];

    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }

    if (parts.length) {
      return parts.join(" ");
    } else {
      return value;
    }
  };

  // Format expiry date
  const formatExpiryDate = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    if (v.length > 2) {
      return `${v.substring(0, 2)}/${v.substring(2, 4)}`;
    }
    return v;
  };

  // Calculate time until subscription renewal
  const getRenewalTime = () => {
    if (!user?.subscription_expiry) return "";
    
    const expiry = new Date(user.subscription_expiry);
    const now = new Date();
    const diffDays = Math.floor((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    return diffDays === 1 
      ? "1 day" 
      : `${diffDays} days`;
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />

      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        <main className="flex-1 relative overflow-y-auto focus:outline-none bg-gray-900">
          <div className="py-6 px-4 sm:px-6 lg:px-8">
            <div className="mb-6">
              <h1 className="text-2xl font-semibold text-white">Subscription</h1>
              <p className="mt-1 text-sm text-gray-300">
                Manage your subscription and credits
              </p>
            </div>

            {/* Current Subscription */}
            <div className="mb-8">
              <h2 className="text-lg font-medium mb-4 text-white">Current Plan</h2>
              <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm">
                <CardContent className="pt-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-lg font-medium text-white">
                        {user?.subscription_type === "pro" ? "Pro Plan" : "Free Plan"}
                      </h3>
                      <p className="text-sm text-gray-300 mt-1">
                        {user?.subscription_type === "pro"
                          ? `Renews in ${getRenewalTime()}`
                          : "Limited features and capabilities"}
                      </p>
                    </div>
                    <Badge variant={user?.subscription_type === "pro" ? "default" : "outline"}>
                      {user?.subscription_type === "pro" ? "Active" : "Free Tier"}
                    </Badge>
                  </div>

                  <div className="mt-6 border-t border-gray-600 pt-6">
                    <h4 className="text-sm font-medium text-gray-300 mb-4">Your Credits</h4>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-2xl font-bold text-white">{user?.credits || 0}</p>
                        <p className="text-sm text-gray-400">Available credits</p>
                      </div>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setSelectedPlan("single_purchase");
                          setPaymentModalOpen(true);
                        }}
                      >
                        Buy More Credits
                      </Button>
                    </div>

                    <div className="mt-4 bg-gray-700/50 p-4 rounded-md">
                      <p className="text-sm text-gray-300">
                        Each credit allows you to download one complete presentation.
                        Pro subscribers receive 5 credits monthly.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Subscription Plans */}
            <div>
              <h2 className="text-lg font-medium mb-4 text-white">Available Plans</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Free Plan */}
                <Card className={cn("bg-gray-800/50 border-gray-700 backdrop-blur-sm", user?.subscription_type === "free" ? "border-indigo-500 shadow-md" : "")}>
                  <CardHeader>
                    <CardTitle className="text-white">Free Plan</CardTitle>
                    <CardDescription className="text-gray-400">Basic features for personal use</CardDescription>
                    <div className="mt-4">
                      <span className="text-3xl font-bold text-white">$0</span>
                      <span className="text-gray-400 ml-1">/month</span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      <li className="flex items-start">
                        <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                        <span className="text-sm text-gray-300">Basic presentations (up to 5)</span>
                      </li>
                      <li className="flex items-start">
                        <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                        <span className="text-sm text-gray-300">Limited AI generation</span>
                      </li>
                      <li className="flex items-start">
                        <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                        <span className="text-sm text-gray-300">Basic editing features</span>
                      </li>
                      <li className="flex items-start">
                        <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                        <span className="text-sm text-gray-300">1 download credit</span>
                      </li>
                      <li className="flex items-start">
                        <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                        <span className="text-sm text-gray-300">Basic coach features</span>
                      </li>
                    </ul>
                  </CardContent>
                  <CardFooter>
                    <Button variant="outline" className="w-full" disabled>
                      Current Plan
                    </Button>
                  </CardFooter>
                </Card>

                {/* Pro Plan */}
                <Card className={cn("bg-gray-800/50 border-gray-700 backdrop-blur-sm", user?.subscription_type === "pro" ? "border-indigo-500 shadow-md" : "")}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-white">Pro Plan</CardTitle>
                        <CardDescription className="text-gray-400">Advanced features for professionals</CardDescription>
                      </div>
                      <Badge>Recommended</Badge>
                    </div>
                    <div className="mt-4">
                      <span className="text-3xl font-bold text-white">$12.99</span>
                      <span className="text-gray-400 ml-1">/month</span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      <li className="flex items-start">
                        <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                        <span className="text-sm text-gray-300">Unlimited presentations</span>
                      </li>
                      <li className="flex items-start">
                        <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                        <span className="text-sm text-gray-300">Advanced AI generation</span>
                      </li>
                      <li className="flex items-start">
                        <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                        <span className="text-sm text-gray-300">Collaborative editing</span>
                      </li>
                      <li className="flex items-start">
                        <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                        <span className="text-sm text-gray-300">5 download credits per month</span>
                      </li>
                      <li className="flex items-start">
                        <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                        <span className="text-sm text-gray-300">AI presentation coach</span>
                      </li>
                    </ul>
                  </CardContent>
                  <CardFooter>
                    {user?.subscription_type === "pro" ? (
                      <Button variant="outline" className="w-full" disabled>
                        Current Plan
                      </Button>
                    ) : (
                      <Button 
                        className="w-full" 
                        onClick={() => {
                          setSelectedPlan("pro");
                          setPaymentModalOpen(true);
                        }}
                      >
                        Upgrade to Pro
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              </div>

              {/* Single Presentation Purchase */}
              <Card className="mt-6 bg-gray-800/50 border-gray-700 backdrop-blur-sm">
                <CardContent className="pt-6">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                    <div>
                      <h3 className="text-lg font-medium text-white">Single Presentation Credit</h3>
                      <p className="text-sm text-gray-300 mt-1">
                        Purchase credits to download individual presentations
                      </p>
                    </div>
                    <div className="mt-4 md:mt-0 flex items-center">
                      <span className="text-2xl font-bold text-white mr-6">$4.99</span>
                      <Button 
                        onClick={() => {
                          setSelectedPlan("single_purchase");
                          setPaymentModalOpen(true);
                        }}
                      >
                        Buy Credit
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* FAQs Section */}
            <div className="mt-12 bg-gray-800/50 rounded-lg p-6 border border-gray-700 backdrop-blur-sm">
              <h2 className="text-lg font-medium mb-4 text-white">Frequently Asked Questions</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium text-white">What is a download credit?</h3>
                  <p className="text-gray-300 text-sm mt-1">
                    A download credit allows you to export one complete presentation as a PPTX or PDF file.
                  </p>
                </div>
                <div>
                  <h3 className="font-medium text-white">How does the Pro subscription work?</h3>
                  <p className="text-gray-300 text-sm mt-1">
                    Pro subscription gives you access to all premium features and 5 download credits each month.
                    Your subscription renews automatically every month.
                  </p>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Can I cancel my subscription?</h3>
                  <p className="text-gray-600 text-sm mt-1">
                    Yes, you can cancel your subscription at any time. You'll continue to have Pro access
                    until the end of your billing period.
                  </p>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Do my unused credits expire?</h3>
                  <p className="text-gray-600 text-sm mt-1">
                    Credits from single purchases never expire. Monthly credits from the Pro plan
                    are valid for 60 days after they're issued.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Payment Modal */}
      <Dialog open={paymentModalOpen} onOpenChange={setPaymentModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Payment Details</DialogTitle>
            <DialogDescription>
              {selectedPlan === "pro"
                ? "Subscribe to Pro Plan - $12.99/month"
                : "Purchase 1 Credit - $4.99"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="card-number">Card Number</Label>
              <div className="relative">
                <Input
                  id="card-number"
                  placeholder="1234 5678 9012 3456"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                  maxLength={19}
                />
                <CreditCard className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Name on Card</Label>
              <Input
                id="name"
                placeholder="John Smith"
                value={cardName}
                onChange={(e) => setCardName(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="expiry">Expiry Date</Label>
                <Input
                  id="expiry"
                  placeholder="MM/YY"
                  value={cardExpiry}
                  onChange={(e) => setCardExpiry(formatExpiryDate(e.target.value))}
                  maxLength={5}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cvc">CVC</Label>
                <Input
                  id="cvc"
                  placeholder="123"
                  value={cardCvc}
                  onChange={(e) => setCardCvc(e.target.value.replace(/\D/g, ""))}
                  maxLength={3}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setPaymentModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handlePurchase}
              disabled={purchaseMutation.isPending}
            >
              {purchaseMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>Pay Now</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
